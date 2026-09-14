# Unchained OSS Contributions

Sign the Contributor License Agreement with your first PR.

## Local setup

Fork or clone the repository and create a branch from the release branch you are
targeting (`v4.8.x` for the current v4 release).

```bash
nvm install
nvm use
npm ci
npm run build:packages
npm run dev
```

Use the Node.js version in `.nvmrc` for the development and test commands. The
development command starts the kitchensink example, the Admin UI, and the package
compiler in watch mode. The examples use MongoDB Memory Server when `MONGO_URL`
is unset; its first run downloads a MongoDB binary.

## Checks before submitting

Add unit and API integration tests for behavior changes, then run:

```bash
npm run lint:check           # Check without changing files
npm run build:packages
npm test                     # Unit, integration, and Docker healthcheck regression tests
```

`npm run lint` also applies fixes. For Admin UI changes, run
`npm run lint:check --workspace admin-ui` and `npm run build --workspace admin-ui`.

Integration tests start their own platform through `tests/setup.js`. They load
`.env.tests` and optional root `.env` overrides; existing shell variables take
precedence. Run one integration test from the repository root with:

```bash
node --no-warnings --env-file .env.tests --env-file-if-exists=.env --test-isolation=none --test-force-exit --test-global-setup=tests/helpers.js --test --test-concurrency=1 tests/auth-user.test.js
```

For a single unit test, use `node --test path/to/test.ts`.
Scheduler timing benchmarks are opt-in because their fixed millisecond budgets
depend on hardware and machine load. Scheduler correctness tests always run.
To run the timing benchmarks on an idle machine:

```bash
UNCHAINED_SCHEDULE_BENCHMARK=1 node --test --test-name-pattern='schedule performance benchmarks' packages/core/src/utils/schedule.test.ts
```

See [docs/README.md](docs/README.md) for documentation development and validation.

Submit a PR against the target release branch with a description of the change
and the checks you ran. Report vulnerabilities through [SECURITY.md](SECURITY.md).
