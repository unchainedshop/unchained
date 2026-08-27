# AGENTS.md

Instructions for AI coding agents working in this repository (Unchained Engine — open-source, headless e-commerce framework for Node.js). Claude Code users: CLAUDE.md is the canonical, more detailed version of this file; keep the two in sync when editing conventions.

## Project overview

Unchained Engine is a modular e-commerce platform built as an npm-workspaces monorepo. It exposes a GraphQL API (primary interface), an MCP server for AI agents, and ships an Admin UI. Docs: https://docs.unchained.shop (full docs as one markdown file: https://docs.unchained.shop/llms-full.txt).

Package layers (higher may depend on lower, never the reverse):

```
platform → api → core → core-* (domain modules) → infrastructure (mongodb, events, logger, utils, roles, file-upload)
```

- `@unchainedshop/platform` — main entry point, bundles everything
- `@unchainedshop/api` — GraphQL API, Express/Fastify adapters, MCP server
- `@unchainedshop/core` — orchestrates all core-* modules
- `core-*` — domain modules (orders, products, users, payment, delivery, …)
- `@unchainedshop/plugins` — payment/delivery/pricing/warehousing adapters

## Essential commands

```bash
npm install                  # install all workspaces
npm run dev                  # kitchensink example + admin-ui + watch packages
npm run build                # clean and rebuild all packages
npm run lint                 # ESLint + Prettier (fixes)
npm run test                 # all tests (unit + integration)
npm run test:run:unit        # unit tests only
npm run test:run:integration # integration tests (kitchensink + tests/)
node --test path/to/test.ts  # single unit test file
# Single integration test (from repo root):
node --no-warnings --env-file .env.tests --env-file-if-exists=.env --test-isolation=none --test-force-exit --test-global-setup=tests/helpers.js --test --test-concurrency=1 path/to/test.ts
```

Requirements: Node.js 24+ (see .nvmrc), MongoDB (or MongoDB Memory Server for tests).

## Import conventions (strict)

- Relative imports MUST include the `.ts` extension: `import seed from './seed.ts'` — never extensionless.
- Workspace packages are imported by package name (optionally subpaths via package.json exports): `import { startPlatform } from '@unchainedshop/platform'`.
- TypeScript runs natively on Node (NodeNext modules, `allowImportingTsExtensions`); no build step needed for dev/tests.

## Architectural constraints (strict)

- Do NOT import `@unchainedshop/mongodb` outside core-* and infrastructure packages. The API layer uses only types and module APIs from core packages; MongoDB logic belongs exclusively in core-* modules.
- Do NOT create standalone `types.ts` files for internal types — place types in the most coherent implementation file. Exception: external API contract types (e.g. payment gateway APIs).
- Do NOT create standalone scripts (Node/Python) to modify code; use direct shell find-and-replace (sed/grep/find) so changes are auditable.

## Plugin system

Directors manage adapters (Director/Adapter pattern). Plugins are side-effect free and must be registered explicitly before platform start. Presets have no default export, and `startPlatform` needs no `modules` argument for built-ins:

```typescript
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';
import { startPlatform } from '@unchainedshop/platform';

registerAllPlugins(); // or registerBasePlugins() / registerCryptoPlugins()
const platform = await startPlatform({});
```

Import preset and plugin subpaths WITHOUT a file extension — the package `exports` map appends `.js` itself (`presets/all.js` would resolve to `all.js.js` and fail).

Cherry-picking individual plugins (v5: `Director.registerAdapter()` is removed; built-in plugins export an `IPlugin` object registered via `pluginRegistry`):

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe';

pluginRegistry.register(StripePlugin);
```

Custom adapters are authored with the typed `registerX()` factories re-exported from `@unchainedshop/core` (e.g. `registerPaymentProvider`, `registerProductPricing`, `registerWorker`) — see `packages/core/src/factory/`.

## Repository layout

- `packages/` — all workspace packages (most development happens here; unit tests live alongside source)
- `examples/` — kitchensink, kitchensink-express, minimal, oidc, ticketing
- `tests/` — end-to-end integration tests
- `admin-ui/` — React back-office
