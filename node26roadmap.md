# Node.js Adoption Roadmap

This records the current runtime baseline and proposals for further work.
The baseline below was checked against the v4.8.x source in September 2026;
the refactors and experiments below remain pending.

## Current baseline

| Area | Repository state |
|---|---|
| Development runtime | All `.nvmrc` files and Node Docker stages pin Node.js 26.8.2 |
| Declared engine floor | All repository package manifests declare `node >=26.8.2`; npm remains `>=10.0.0` where specified |
| TypeScript | TypeScript 5.9 at the root, Node.js 26 type definitions |
| Build | `tsc --build` emits package artifacts to `lib/`; root references also include examples |
| Tests | Native `node --test`; `npm test` runs package unit tests, integration tests, then Docker healthcheck regression tests; integration tests use global setup and share a process |
| Development examples | Native TypeScript through `node --watch` |
| Database | MongoDB driver 7 |
| Scheduling | Native cron parser in `packages/core/src/utils/schedule.ts` |

The native TypeScript test/development loop has already landed. Keep the
TypeScript build for published JavaScript and declarations, and for workspace
imports that resolve to `lib/`. There is no root `pretest` script.

## Runtime alignment completed

The supported minimum is now Node.js **26.8.2**. Package engines, `.nvmrc` files,
Node Docker stages, contributor guidance, and CI use that baseline. This supersedes
the earlier proposal to adopt Node.js 24. See the
[migration guide](MIGRATION.md#v48x-nodejs-baseline-2682) before upgrading deployments.

The optional `@parse/node-apn@8.1.0` dependency still declares support for Node.js
20, 22, and 24 only. Its Apple Wallet update-notification integration therefore
remains outside the dependency's declared Node.js 26 support. Verify that
integration before relying on pass update notifications; its engine metadata has
not been overridden.

The shared compiler target is `esnext`, so native syntax such as `using` can be
preserved in published output. Future syntax and API adoption still needs
validation on the exact minimum release, including dependency requirements and
test-runner flags. Keep the package build and runtime tests in CI.

## Small refactors to evaluate

1. **Shared expiration comparison.** Enrollment and quotation modules both compare
   a reference date with `expires`. Their public signatures differ: enrollment
   callers supply the options object, while quotations default it. Share the
   comparison without changing those interfaces or the strict `>` boundary.
   Sources: [enrollments](packages/core-enrollments/src/module/configureEnrollmentsModule.ts)
   and [quotations](packages/core-quotations/src/module/configureQuotationsModule.ts).

2. **Named duration constants.** Replace repeated millisecond literals where a
   name would explain the intent. In
   [FailedRescheduler](packages/core/src/directors/FailedRescheduler.ts), replacing
   `new Date(now.setSeconds(now.getSeconds() + 5))` with arithmetic would also avoid
   mutating `now`; preserve observable scheduling behavior.

3. **Grouping helpers.** Evaluate native grouping or Set operations in pricing
   calculations where they improve readability and are available on the supported
   minimum runtime. Preserve key ordering, rounding, and duplicate semantics.

The [event worker debounce](packages/core/src/directors/EventListenerWorker.ts)
already uses an abortable promise timer. It has no hand-written Promise executor
to replace with `Promise.withResolvers`; any refactor must preserve cancellation.

## Resource cleanup to evaluate

[createDatabaseResource](packages/mongodb/src/initDb.ts) already exposes an
`AsyncDisposable` wrapper. Evaluate scope-bound cleanup for:

- Order locks in checkout, confirmation, and rejection services.
- Discount adapter reservations on success and error paths.
- Short-lived MongoDB sessions/cursors in tests and scoped operations.
- Timers and event subscriptions during platform shutdown.

Check disposal support in the installed driver and runtime. Preserve lock-release
ordering and original errors when cleanup also fails. Keep the long-lived shared
MongoDB client under the existing platform lifecycle.

## Date and time work

Evaluate Temporal only when its runtime support matches the supported engine
floor. Start with DST, month-end, and recurrence behavior in
[schedule.ts](packages/core/src/utils/schedule.ts),
[addToDate.ts](packages/core-enrollments/src/addToDate.ts), and
[EnrollmentAdapter](packages/core/src/directors/EnrollmentAdapter.ts).
Keep the cron parser and persist BSON `Date` values at the database boundary.
A rewrite needs correctness tests and measurements; it is not a promised speedup.

## Document ID experiment

[generateDbObjectId](packages/mongodb/src/generate-db-object-id.ts) currently
creates random hexadecimal IDs (24 digits by default). Time-ordered IDs could
change insert locality, but any performance benefit needs a workload benchmark.

A 24-hex ID has 96 bits total. A 48-bit timestamp prefix leaves only 48 random
bits; it cannot also retain a UUIDv7-sized random suffix in the same format.
Changing the format requires a collision, concurrency, and information-exposure
review. Existing IDs must remain valid. Do not present this as a drop-in change
or rely on IDs as authorization credentials.

## Validation for implementation work

- Run unit tests and affected integration tests on Node.js 26.8.2.
- Test expiry boundaries, disposal after errors, DST, month-end, and leap-year cases.
- Build published artifacts and exercise them separately from source TypeScript.
- Benchmark ID changes against the existing generator using the same database,
  dataset, concurrency, index definitions, and hardware.
- Keep runtime adoption and security-sensitive password-format migrations separate.
