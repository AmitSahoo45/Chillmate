import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadTs } from "./test-loader.mjs";

const enabled = process.env.AI_GUARD_RUN_DB_TESTS === "true";
if (enabled) config({ path: ".env.local", quiet: true });
const { createQuotaStore } = loadTs("lib/ai-guard/store.ts");
const { guardPeriod, reservationMicros } = loadTs("lib/ai-guard/policy.ts");
const schema = loadTs("lib/db/schema.ts");
const reservation = { inputBytes: 65536, maxOutputTokens: 2048, reservedMicros: reservationMicros(65536, 2048) };
const owner = { userId: "guard-test-owner", group: "owner", kind: "chat" };
const guest = { userId: "guard-test-guest", group: "guest", kind: "chat" };

async function isolated(run) {
  const url = process.env.AI_GUARD_TEST_DATABASE_URL || process.env.DATABASE_URL;
  assert.ok(url, "Configure a test database or explicitly opt in to isolated namespaces on DATABASE_URL");
  const clients = Array.from({ length: 4 }, () => postgres(url, { max: 1, connect_timeout: 10, idle_timeout: 5 }));
  const namespace = `test-${randomUUID()}`;
  const stores = clients.map((client) => createQuotaStore(drizzle(client, { schema }), namespace));
  const sql = clients[0];
  try {
    const [{ now }] = await sql`select clock_timestamp() as now`;
    await run({ stores, sql, namespace, period: guardPeriod(new Date(now)) });
  } finally {
    // Only this invocation's random test namespace is removable; product data and
    // production quotas are never touched, and no API/model calls are made.
    await sql`delete from ai_guard_reservations where namespace = ${namespace}`;
    await sql`delete from ai_guard_requests where namespace = ${namespace}`;
    await sql`delete from ai_guard_windows where key like ${`${namespace}:%`}`;
    await Promise.all(clients.map((client) => client.end({ timeout: 5 })));
  }
}

test("database: concurrent reservations cannot overspend one guest's daily allowance", { skip: !enabled }, async () => {
  await isolated(async ({ stores, sql, namespace }) => {
    const results = await Promise.allSettled(Array.from({ length: 8 }, (_, index) => stores[index % 4].reserveModelCall(guest, reservation)));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 2);
    assert.ok(results.filter((r) => r.status === "rejected").every((r) => r.reason.code === "budget_exhausted"));
    const [ledger] = await sql`select count(*)::int as count, sum(reserved_micros)::int as reserved from ai_guard_reservations where namespace = ${namespace}`;
    assert.equal(ledger.count, 2);
    assert.equal(ledger.reserved, reservation.reservedMicros * 2);
  });
});

for (const [group, scope, cap] of [["owner", "owner", 75e6], ["guest", "guest", 25e6], ["owner", "global", 100e6]]) {
  test(`database: atomic ${scope} monthly limit survives concurrent calls across connections`, { skip: !enabled }, async () => {
    await isolated(async ({ stores, sql, namespace, period }) => {
      const key = `${namespace}:${scope}:month:${period.month}`;
      await sql`insert into ai_guard_windows (key, reserved_micros) values (${key}, ${cap - reservation.reservedMicros})`;
      const results = await Promise.allSettled(stores.map((store, index) => store.reserveModelCall({ ...owner, group, userId: `guard-test-${index}` }, reservation)));
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      const [window] = await sql`select reserved_micros as reserved from ai_guard_windows where key = ${key}`;
      assert.equal(window.reserved, cap);
      const [ledger] = await sql`select count(*)::int as count from ai_guard_reservations where namespace = ${namespace}`;
      assert.equal(ledger.count, 1);
    });
  });
}

test("database: no partial reservations when a daily window denies payment", { skip: !enabled }, async () => {
  await isolated(async ({ stores, sql, namespace, period }) => {
    const key = `${namespace}:owner:day:${period.day}`;
    await sql`insert into ai_guard_windows (key, reserved_micros) values (${key}, 5000000)`;
    await assert.rejects(stores[0].reserveModelCall(owner, reservation), (error) => error.code === "budget_exhausted");
    const [windows] = await sql`select count(*)::int as count from ai_guard_windows where key like ${`${namespace}:%`}`;
    const [ledger] = await sql`select count(*)::int as count from ai_guard_reservations where namespace = ${namespace}`;
    assert.equal(windows.count, 1);
    assert.equal(ledger.count, 0);
  });
});

test("database: concurrent request starts enforce rolling owner3/min and guest1/min", { skip: !enabled }, async () => {
  for (const [access, limit] of [[owner, 3], [guest, 1]]) {
    await isolated(async ({ stores }) => {
      const results = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => stores[i % 4].reserveRequest(access)));
      assert.equal(results.filter((r) => r.status === "fulfilled").length, limit);
      assert.ok(results.filter((r) => r.status === "rejected").every((r) => r.reason.code === "rate_limited"));
    });
  }
});

test("database: global10/min bounds starts across many different guests", { skip: !enabled }, async () => {
  await isolated(async ({ stores }) => {
    const results = await Promise.allSettled(Array.from({ length: 13 }, (_, i) => stores[i % 4].reserveRequest({ ...guest, userId: `guard-test-${i}` })));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 10);
  });
});

test("database: completed request limits persist across a new store instance", { skip: !enabled }, async () => {
  await isolated(async ({ stores, sql, namespace, period }) => {
    for (const [access, limit] of [[owner, 100], [guest, 10], [{ ...owner, kind: "operator" }, 3]]) {
      const rows = Array.from({ length: limit }, () => ({ namespace, user_id: access.userId, kind: access.kind, created_at: period.dayStart.toISOString() }));
      await sql`insert into ai_guard_requests ${sql(rows)}`;
      await assert.rejects(stores[1].reserveRequest(access), (error) => error.code === "rate_limited");
    }
  });
});
