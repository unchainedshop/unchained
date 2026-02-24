---
sidebar_position: 14
title: Contributing
sidebar_label: Contributing
description: Development workflow, code standards, and how to contribute to Unchained Engine
---

# Contributing

This guide covers how to set up a development environment and contribute to Unchained Engine.

## Prerequisites

- **Node.js 22+** (25 recommended, see `.nvmrc`)
- **MongoDB** (or MongoDB Memory Server for testing)
- **npm** (uses npm workspaces)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/unchainedshop/unchained.git
cd unchained

# Install dependencies
npm install

# Start development
npm run dev
```

`npm run dev` starts:
- The kitchensink example on port 3000
- Admin UI
- Watch mode for all packages

## Monorepo Structure

```
unchained/
├── packages/
│   ├── api/              # GraphQL API, Express/Fastify adapters, MCP server
│   ├── core/             # Business logic coordination
│   ├── core-*/           # Domain modules (orders, products, users, etc.)
│   ├── events/           # Event system
│   ├── logger/           # Logging utilities
│   ├── mongodb/          # MongoDB integration
│   ├── platform/         # Main entry point, combines all packages
│   ├── plugins/          # Plugin adapters (payment, delivery, pricing, etc.)
│   ├── roles/            # RBAC permission system
│   ├── ticketing/        # Event ticketing
│   └── utils/            # Shared utilities
├── examples/
│   ├── kitchensink/      # Full-featured Fastify example (default)
│   ├── kitchensink-express/  # Express alternative
│   ├── minimal/          # Minimal setup example
│   ├── oidc/             # OIDC authentication example
│   └── ticketing/        # Ticketing example
├── tests/                # Integration tests
└── docs/                 # Documentation (Docusaurus)
```

## Package Hierarchy

```
platform → api → core → core-* → infrastructure (mongodb, events, logger, utils, roles)
```

Higher-level packages should only import from lower-level packages. Specifically:
- **DO NOT** import `@unchainedshop/mongodb` outside of `core-*` and infrastructure packages
- The API layer should use module APIs exposed by core packages, not direct MongoDB access

## Development Commands

```bash
npm run dev          # Start development with hot-reload
npm run build        # Clean and rebuild all packages
npm run dev:watch    # Watch mode for TypeScript compilation
npm run lint         # Lint and fix code (ESLint + Prettier)
npm run test         # Run all tests
npm run test:run:unit        # Unit tests only
npm run test:run:integration # Integration tests
```

## Code Conventions

### Import Style

Use `.ts` extensions for relative imports, no extensions for package imports:

```typescript
// Relative imports - MUST include .ts extension
import { something } from './utils.ts';
import { other } from '../helpers/index.ts';

// Package imports - no extension
import { startPlatform } from '@unchainedshop/platform';
```

### TypeScript

- Module system: `NodeNext` (native ESM)
- `allowImportingTsExtensions: true`
- No compilation needed for development: `node --watch src/file.ts`

### Types

- Place types in the most relevant implementation file, not separate `types.ts` files
- Exception: external API contract types may use a dedicated types file

## Running Tests

```bash
# All tests
npm run test

# Single unit test
node --test packages/core-orders/src/orders.test.ts

# Single integration test (from monorepo root)
node --no-warnings \
  --env-file .env.tests \
  --env-file-if-exists=.env \
  --test-isolation=none \
  --test-force-exit \
  --test-global-setup=tests/helpers.js \
  --test \
  --test-concurrency=1 \
  tests/path/to/test.ts
```

## Pull Requests

1. Fork the repository
2. Create a feature branch from `master`
3. Make your changes following the code conventions
4. Ensure tests pass: `npm run test`
5. Ensure lint passes: `npm run lint`
6. Submit a pull request against `master`

## Getting Help

- [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
- [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
- [support@unchained.shop](mailto:support@unchained.shop) for enterprise support
