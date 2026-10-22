import "./register-test-imports.mjs";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { registerHooks } from "node:module";
import test from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";

const schema = await import("../db/schema.ts");
const dialect = new PgDialect();

async function withIsolatedOrchestrator(check) {
  const ownerId = `synthetic-owner-${randomUUID()}`;
  const previousOwner = process.env.AI_OWNER_USER_ID;
  const slot = `operator-orchestration-test-${randomUUID()}`;
  const captured = { ownerQueries: [], runQueries: [], locks: [] };
  const transaction = {
    execute: async (query) => {
      captured.locks.push(dialect.sqlToQuery(query));
      return [{ locked: true }];
    },
    select: () => ({ from: (table) => {
      assert.equal(table, schema.operatorRuns);
      return { where: (condition) => ({ limit: async (limit) => {
        assert.equal(limit, 1);
        captured.runQueries.push(dialect.sqlToQuery(condition));
        // Represent an already completed run: no business mutations are needed.
        return [{ noteId: "synthetic-existing-note" }];
      } }) };
    } }),
  };
  globalThis[Symbol.for(slot)] = {
    select: () => ({ from: (table) => {
      assert.equal(table, schema.users);
      return { where: (condition) => ({ limit: async (limit) => {
        assert.equal(limit, 1);
        captured.ownerQueries.push(dialect.sqlToQuery(condition));
        return [{ id: ownerId }];
      } }) };
    } }),
    transaction: async (work) => work(transaction),
  };
  const moduleUrl = new URL(`./runner.ts?orchestrator-test=${randomUUID()}`, import.meta.url).href;
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "@/lib/db" && context.parentURL === moduleUrl) {
        return {
          url: `data:text/javascript,${encodeURIComponent(`export const db = globalThis[Symbol.for(${JSON.stringify(slot)})];`)}`,
          shortCircuit: true,
        };
      }
      return nextResolve(specifier, context);
    },
  });
  try {
    process.env.AI_OWNER_USER_ID = ownerId;
    const { runOperator } = await import(moduleUrl);
    await check({ runOperator, ownerId, captured });
  } finally {
    hooks.deregister();
    delete globalThis[Symbol.for(slot)];
    if (previousOwner === undefined) delete process.env.AI_OWNER_USER_ID;
    else process.env.AI_OWNER_USER_ID = previousOwner;
  }
}

test("scheduled operator queries only the configured owner and scopes its completed-run lookup", async () => {
  await withIsolatedOrchestrator(async ({ runOperator, ownerId, captured }) => {
    const result = await runOperator("morning");
    assert.equal(result.alreadyCompleted, 1);
    assert.equal(result.completed, 0);
    assert.equal(result.toolCalls, 0);
    assert.deepEqual(captured.ownerQueries.map((query) => query.params), [[ownerId]]);
    assert.match(captured.ownerQueries[0].sql, /"user"\."id" = \$1/);
    assert.equal(captured.runQueries.length, 1);
    assert.equal(captured.runQueries[0].params[0], ownerId);
    assert.equal(captured.runQueries[0].params[1], "morning");
    assert.deepEqual(captured.locks[0].params, [`chillmate-operator:${ownerId}`]);
  });
});

test("missing configured owner stops the scheduler before any database access", async () => {
  await withIsolatedOrchestrator(async ({ runOperator, captured }) => {
    delete process.env.AI_OWNER_USER_ID;
    await assert.rejects(runOperator("night"), (error) => error.name === "AiGuardError" && error.status === 503);
    assert.deepEqual(captured.ownerQueries, []);
    assert.deepEqual(captured.runQueries, []);
    assert.deepEqual(captured.locks, []);
  });
});
