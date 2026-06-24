# Node.js 25/26 Adoption Roadmap

How the Unchained Engine can benefit from Node.js 24/25/26 features, ranked by impact / effort / safety.

## Context

Node 26 becomes the next Active LTS (released 2026-05-05 as *Current*; Active LTS **2026-10-28**), carrying V8 14.6 and shipping the headline features in scope here: **Temporal** (unflagged) and the now-mature **Explicit Resource Management** (`using`/`await using`, stable since Node 24).

**Starting point (verified in-repo):** ESM TypeScript monorepo, `engines.node >=22.0.0`, `.nvmrc=25`, runs Node v25.9.0, `@types/node ^25`, `typescript ^5.9.3`, `mongodb ^7`, build via `tsc --build` to `lib/`. The codebase is already modern — `Array.fromAsync`, `--env-file`, `node --test`, `crypto.randomUUID`, `structuredClone`, `AbortController`, a native `schedule.ts` cron engine (replaced `@breejs/later`), and **no date library at all**. The tsconfig is even **type-strip-ready** (`packages/shared/node-native.tsconfig.json`: `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions`, `rewriteRelativeImportExtensions`).

The remaining wins are concentrated, not broad — and split cleanly by what the `engines.node` floor allows.

## The decision that gates everything: the engine floor

| Feature cluster | Min Node | On `>=22` floor? |
|---|---|---|
| Pure-JS refactors, `Object.groupBy`/Set algebra, `Promise.withResolvers`, native-TS dev loop, time-ordered IDs | 21–22 | ✅ Safe today |
| **Explicit Resource Management** (`using`/`await using`, `DisposableStack`, Mongo v7 `asyncDispose`), `RegExp.escape`, `Error.isError` | **24** | ❌ `using` is a **hard SyntaxError** on Node 22 |
| **Temporal** (unflagged), `crypto.randomUUIDv7`, `Map.getOrInsert` | **26** | ❌ flagged on 24/25, absent on 22 |

`tsc` at the repo's `target: "esnext"` would emit **native** `using` into `lib/` (current `lib/` emits plain `try/finally` only because there's no `using` in source yet) — which would break any Node-22 consumer. The team already runs Node 25 (`.nvmrc=25`), so the runtime is fine; the published-floor promise is the only blocker.

**Decision: bump `engines.node` to `>=24`.** Cleanest path — emit native `using` with no polyfill and no build-target change. Drops Node 22 consumers (Node 22 is EOL April 2027; the team is already on 25). This unblocks the entire Wave 1 ERM tier. *(Rejected alternative: keep `>=22` and downlevel `using` via `target: es2022` + a `Symbol.[async]Dispose` polyfill at every entrypoint — it touches the shared base tsconfig every package extends, a monorepo-wide emit change with per-package polyfill load.)*

---

## Performance: the single biggest lever (time-ordered document IDs)

The one item with a structural, measurable **steady-state runtime** upside — and it is **not** gated on the Node version.

`packages/mongodb/src/generate-db-object-id.ts` generates every collection's `_id` as a **fully random 24-hex string** (`crypto.getRandomValues` → hex). Random `_id`s scatter inserts across the `_id` B-tree → constant page splits, index fragmentation, and a hot working set that won't stay in RAM. On high-write collections (orders, order positions, events, work queue) this directly taxes insert throughput and inflates resident index size. (It's why Mongo's own `ObjectId` is timestamp-prefixed — the engine opted out with random hex.)

**Change:** make `generateDbObjectId` produce **time-ordered** IDs. Node 26's `crypto.randomUUIDv7` is the standardized form, but a 48-bit `Date.now()` hex prefix + random suffix (hex ULID) gives the identical B-tree benefit **today on the `>=22` floor** and preserves the existing 24-hex format. New inserts append to the right edge → near-zero page splits, better locality, smaller hot index.

Caveats:
1. **New inserts only** — existing `_id`s can't be rewritten, so the index stays mixed until old docs age out (still net-positive on growing collections).
2. **Security tradeoff** — time-ordered IDs leak creation time + rough insertion order. Keep ≥74 random suffix bits (UUIDv7/ULID-grade) to retain unguessability/non-enumerability. A deliberate call given the engine's audit history.
3. Downstream code must keep treating IDs as opaque strings (it does).

Scope: one file + a focused insert-throughput benchmark.

**Other performance notes:** the Node 26 upgrade *itself* gives free wins — ~12% faster `JSON.parse` on large payloads (GraphQL layer) and Undici 8 (faster outbound `fetch` to payment/delivery/tax providers) — but those are "upgrade Node," not code changes. ERM (Wave 1) is a **tail-latency/resilience** win (prevents leaked cursors/sessions → pool exhaustion, leaked locks → contention stalls), not throughput. Temporal is *slower* than `Date` — adopt for correctness only. `Object.groupBy`/Set algebra are micro-level. The native-TS loop is a build/CI-time win, not production runtime.

---

## Wave 0 — Safe now, no engine bump (`>=22`)

Ranked by impact/effort; none touches the floor.

1. **Unify duplicated `isExpired`.** Near-verbatim copies in `packages/core-enrollments/src/module/configureEnrollmentsModule.ts:57` and `packages/core-quotations/src/module/configureQuotationsModule.ts:185` (both `new Date(referenceDate)` + strict `relevantDate.getTime() > expiryDate.getTime()`). Extract `isExpired(expires, referenceDate?)` into `packages/utils`, call from both. Keep strict `>`; storage stays BSON Date. *Removes a copy-paste correctness hazard across two billing-critical domains.*

2. **Name the magic millisecond constants + fix the `setSeconds` smell.** Hardcoded `86400000` / `24*60*60*1000` in `packages/api/src/mcp/tools/order/handlers/getSalesSummary.ts:33`, `packages/api/src/mcp/utils/orderFilters.ts:50`, `packages/api/src/express/createTempUploadMiddleware.ts:1`, plus `getTime()+ms` in `packages/core/src/directors/WarehousingDirector.ts:138`. Fold in the in-place mutation at `packages/core/src/directors/FailedRescheduler.ts:38` (`new Date(now.setSeconds(now.getSeconds()+5))` mutates `now`; replace with `new Date(now.getTime()+5000)`). Shared named constants now → `Temporal.Duration` in Wave 2. Zero behavior change.

3. **`Object.groupBy`/`Map.groupBy` + native Set algebra** (Node 21/22, stable on floor). Replace `reduce`-based grouping at `packages/core/src/directors/BasePricingSheet.ts:62/93`, `packages/core/src/directors/EnrollmentAdapter.ts:92`, `packages/core/src/services/calculateDiscountTotal.ts:66`; use `Set.intersection`/`difference` for assortment/filter/role-eligibility checks. **Leave the already-optimal `new Set(...)` dedupes in DataLoader batch fns alone.** Apply opportunistically. Use `Map.groupBy` for non-string keys.

4. **`Promise.withResolvers` in the worker debounce.** `packages/core/src/directors/EventListenerWorker.ts:9` hand-rolls a deferred with a manual `AbortController` + `node:timers/promises` `setTimeout`. Replace the executor-closure with `Promise.withResolvers()`. Purely syntactic.

5. **(Optional) Native TypeScript dev/test loop.** The repo is already strip-ready. Run `.ts` sources/tests directly via Node (type stripping is *stable* on Node 24.12+/25.2+) to drop the transpile step in the dev/test inner loop. **`tsc --build` must remain** for `.d.ts` + `.js` publish artifacts. Payoff only if iteration speed is a felt pain. *Note: `--experimental-transform-types` was removed in Node 26 — never introduce enums/namespaces/decorators; `erasableSyntaxOnly` already enforces this.*

6. **Time-ordered IDs** — see the Performance section. Self-contained, safe on `>=22`, highest runtime payoff.

---

## Wave 1 — Explicit Resource Management (after the `>=24` floor bump)

The **highest real-world value** for a server engine: convert duplicated, leak-prone `try/finally` cleanup into scope-bound, deterministic disposal. Set `engines.node >=24.0.0` (`.nvmrc` is already 25 — align the CI matrix). The team is already signaling intent — `createDatabaseResource` in `packages/mongodb/src/initDb.ts:105` *already implements `AsyncDisposable` correctly*.

1. **`await using` for order locks.** `acquireLock` (`packages/core-orders/src/module/configureOrdersModule.ts:177`, `@kontsedal/locco`) returns a lock handle. Wrap it so the handle implements `[Symbol.asyncDispose] = () => lock.release()` (idempotent). The three duplicated `try { … } finally { lock.release() }` blocks in `packages/core/src/services/checkoutOrder.ts:39`, `confirmOrder.ts:17`, `rejectOrder.ts:17` collapse to `await using lock = await this.orders.acquireLock(...)`. *Deadlock-prevention in the most concurrency-sensitive path.*

2. **`AsyncDisposableStack` for discount-adapter reservations.** `adapter.release()` is called by hand in scattered catch/finally branches: `packages/core/src/services/updateCalculation.ts:51`, `removeCartDiscount.ts:26`, `createManualOrderDiscount.ts:52`. Expose `[Symbol.asyncDispose]` on the adapter (or wrap), then `stack.use(...)` + commit-on-success via `stack.move()`. Closes a reservation-leak risk on new error branches.

3. **Native Mongo v7 session/cursor disposal.** Where code starts sessions or iterates cursors, use `await using session = client.startSession()` (auto-`endSession`) and `await using cursor = coll.find(..., { session })` (auto-close). Promote `createDatabaseResource` (`initDb.ts:105`) for scoped/test contexts. **Do not** touch the long-lived global `mongoClient` lifecycle (`initDb.ts:131`). Driver v7 still labels `asyncDispose` experimental; requires Node ≥20.19 — under a `>=24` floor.

4. **Disposable timers/listeners + consolidated shutdown.** Manual `clearInterval`/`clearTimeout` in `packages/api/src/mongo-store.ts:251`, `packages/core/src/directors/IntervalWorker.ts:55`, `packages/events/src/audit/index.ts` (flush timer), `packages/platform/src/startPlatform.ts:127`. Add `[Symbol.dispose]`/`[Symbol.asyncDispose]` to `MongoStore`/`AuditLog` (extend existing `close()`), aggregate platform teardown with a `DisposableStack`, and have `EventListenerWorker` track unsubscribers. Robustness/clarity — most timers already `unref()`. *The `[Symbol.dispose]` methods can be authored on `>=22` today; only the `using` call sites need 24+.*

5. **`RegExp.escape` / `Error.isError`** (Node 24): replace the hand-rolled search-term escape (ReDoS/injection footgun in filter/search query building) and `instanceof Error` checks across worker/plugin error paths.

**SuppressedError caveat (applies to 1–4):** if a disposer throws, the *last* disposer error propagates and the original nests in `.suppressed`/`.error`. Audit centralized error/audit logging to unwrap it, or root causes get lost. Disposal is strictly LIFO.

---

## Wave 2 — Target Node 26 Active LTS (2026-10-28): Temporal & friends

Temporal is **flagged on 24/25, absent on 22**; only Node 26 has it unflagged (still surfaced as *experimental*). Adopting before the floor is Node 26 means a polyfill (`temporal-polyfill` ~20kB gz) **and** every value still round-trips through `new Date(instant.epochMilliseconds)` at the Mongo BSON-Date boundary (ns precision truncated). So Temporal is a **post-Node-26-LTS** direction, pre-staged by Wave 0 #2.

When the floor reaches Node 26 LTS:
- **`schedule.ts` / `addToDate` / `periodForReferenceDate`** — the hand-rolled local-time date math (`packages/core/src/utils/schedule.ts`, `packages/core-enrollments/src/addToDate.ts`, `packages/core/src/directors/EnrollmentAdapter.ts:37`) becomes DST/timezone-correct via `Temporal.ZonedDateTime`/`PlainDateTime.add`/`Duration`. **Keep the custom cron *parser*** — Temporal has no cron parsing and the field-advancing loop is already optimized; swap only the underlying date arithmetic.
- **Session TTL / expiry math** (`packages/api/src/mongo-store.ts`, the unified `isExpired`) → `Temporal.Instant` comparisons.
- **Magic-duration constants** (from Wave 0 #2) → `Temporal.Duration.from({days:1})`.
- **`crypto.randomUUIDv7`** — the standardized form of the time-ordered IDs from the Performance section (that win is available today without waiting for Node 26).
- **`Map.getOrInsert`/`getOrInsertComputed`** — cleaner cache/memoization.
- **Migration chores at the bump:** `NODE_MODULE_VERSION` → 147 (rebuild native addons, e.g. `@mongodb-js/zstd`); `--experimental-transform-types` removed (already safe via `erasableSyntaxOnly`); legacy `_stream_*` modules removed; Rust + GCC 13.2+ needed for build-from-source.

**Persistence rule throughout:** keep MongoDB on BSON `Date`; convert to Temporal only at the edges where wall-clock/timezone semantics matter.

---

## Explicitly NOT worth it now

- **Broad Temporal adoption while floor is `<26`** — polyfill cost + mandatory Date round-trip + still-experimental.
- **Rewriting the cron parser/`getNextOccurrences` with Temporal** — no native cron; existing loop optimized; underpins all job timing. High risk, low reward.
- **Shipping ERM while floor stays `>=22`** — native `using` SyntaxErrors on Node 22 consumers. Resolved by the decided `>=24` bump; do not adopt `using` before that bump lands.
- **`node --run` to replace `npm-run-all`** — can't do parallel fan-out (the `run-p dev:*`/`build:*` in `package.json:71/77` is load-bearing) and skips pre/post hooks (`pretest` ESLint). Keep `npm-run-all`.
- **`bcryptjs` → `node:crypto` scrypt** (`packages/core-users/src/module/configureUsersModule.ts:1`, pbkdf2 fallback at `:431`) — a security-critical hash-format migration (existing bcrypt hashes can't rehash without a login; scrypt is CPU-bound/event-loop risk). Not a Node-version play.
- **`node:sqlite`, `Float16Array`, `Atomics.pause`, native WebSocket server** — irrelevant to a MongoDB-backed transactional engine (no built-in WS *server* exists, so `ws`/`graphql-ws` stays; SQLite is niche test-fixture only).
- **GridFS write-stream `await using`** (`packages/plugins/src/files/gridfs/handler-express.ts:67`) — existing `pipeline()`+`finished()` already handles cleanup. Low priority.

---

## Verification

- **Wave 0:** unit-test the extracted `isExpired` (boundary: equal timestamps stay non-expired); confirm magic-constant refactors are byte-equal in behavior. For time-ordered IDs, benchmark insert throughput + index size on an insert-heavy collection before/after. `npm run test:run:unit` + `npm run lint`.
- **Native-TS spike (if pursued):** run a package's tests via `node --test` on `.ts` directly vs current path; compare results + wall-clock.
- **Wave 1:** integration tests around order checkout/confirm/reject (`tests/`) proving lock release on both success and thrown-error paths; add a test that forces a throw inside the `await using` scope and asserts release. Confirm no Node-22-only consumers remain before bumping `engines.node`; bump `.nvmrc`/CI matrix to 24+.
- **Wave 2:** gate on Node 26 Active LTS; rebuild native addons; run full `npm run test` on Node 26; verify Temporal date math against existing `schedule.test.ts` / `periodForReferenceDate.test.ts` golden values (esp. DST/month-end/leap-year).
