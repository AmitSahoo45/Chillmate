# Chillmate

Next.js App Router rewrite. Parent folder `D:\Projects\21-Chillmate` holds the plan and agent memory.

```bash
npm run dev
npm run lint
npm run build
```

Do not push to Vercel until asked.

## Operator

Production is https://chillmate.vercel.app. Set the values listed in `.env.example`
in Vercel Production. `AI_OWNER_USER_ID` is the database user ID for the owner;
`AI_GUEST_ACCESS_ENABLED=true` enables other Google-authenticated users' AI pool.
Keep all credentials in environment secrets, never in this repository.

After schema changes, run `npm run db:generate` and `npm run db:migrate`.
The operator workflow requires the repository Actions secret `OPERATOR_SECRET`,
matching Vercel. It calls `POST /api/operator?run=night|morning` with an `x-secret`
header at 23:30 and 06:30 Asia/Kolkata (18:00 and 01:00 UTC).
Enable Fluid Compute in Vercel's project Functions settings: the operator uses
a 300-second function limit, which requires Fluid Compute on Hobby.
GitHub scheduled runs can be delayed; the five-minute acceptance window is not a
scheduling guarantee. The workflow also supports manual dispatch.

The operator runs only for the configured owner. Night processes today's active
notes marked by `dumpNoteAction`; earlier unmarked notes are not inferred to be
dumps. It uses the shared copilot create tools, never deletes, and archives sources
and records a Night log only after the whole transaction succeeds. There are at
most 40 tool executions. Failed or partial processing rolls back business writes.
Successful runs are idempotent for each owner, run kind, and IST date.

Morning uses no model. It selects up to three existing open tasks, earliest due
date first (undated last), then oldest creation time. Each task occupies one line;
the final line is `Carried over: N`, counting open tasks not selected. It creates
and pins `Today — YYYY-MM-DD` in Daily, unpins yesterday's operator note, and
renders today's note before Quick Dump on `/app`. It never invents missing tasks.

## AI spending controls

All paid calls use `claude-haiku-5-5`. PostgreSQL serializes allowance reservations
before each provider call across instances. Reservations remain consumed after
errors, cancellation, and operator rollback. If accounting or access configuration
is unavailable, paid calls are blocked. No automatic provider retries are enabled.

| Scope | Monthly allowance | Daily allowance | Request limit |
| --- | --- | --- | --- |
| Owner, including night operator | $75 | $5 | Chat: 3/minute, 100/day; night: 3 attempts/day |
| All other users combined | $25 | $1 | Included in global 10 starts/minute |
| Each other user | $1 | $0.10 | 1/minute, 10/day |
| Entire app | $100 | $6 | 10 starts/minute |

Daily and monthly windows reset in IST; minute limits use a rolling window.
The pools cannot borrow from each other. A request can stop mid-conversation if
its next model call exceeds the remaining allowance. Limits use conservative
reserved cost, not the provider's invoice: serialized input bytes plus 8,192
overhead tokens, at $0.50/million input and $2.50/million output tokens. Unused
reservations are not refunded, so the app may stop before actual billing reaches
these amounts. See [Haiku pricing](https://platform.claude.com/docs/en/models/haiku-5-5/overview).
Review the bound when pricing changes. Calls made elsewhere with the same key and
usage before this release are outside this ledger. Set an Anthropic organization
monthly spending limit of $100 in Console Billing as an independent backstop.

Chat requires a same-origin authenticated POST, a maximum 32 KiB JSON body, and
text-only input of at most 2,000 characters. Client roles, media, tool results,
model choices and provider metadata are never forwarded. Each model call is
limited to 64 KiB of serialized context and 2,048 output tokens; chat permits
five model steps and 60 seconds. Oversized operator context fails without
archiving sources. Only workspace tools are allowed; paid provider tools, cache
writes and service-tier overrides are disabled. Provider payloads are not logged
or returned in errors.

## Verification

Run `npm run lint` and `npm run build`. Node's built-in runner covers request
validation, tool limits, date selection, owner scoping and rollback behavior:

```powershell
node --env-file=.env.local --experimental-strip-types --experimental-test-isolation=none --test lib/chat/request.test.mjs lib/operator/*.test.mjs
node lib/ai-guard/policy.test.mjs
$env:AI_GUARD_RUN_DB_TESTS = 'true'
node lib/ai-guard/store.test.mjs
```

Operator database tests wrap synthetic fixtures in rollback transactions. Guard
concurrency tests use isolated random test namespaces and clean only those test
rows. These tests do not call a paid model.
