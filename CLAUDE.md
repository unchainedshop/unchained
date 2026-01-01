# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm install          # Install all dependencies (uses npm workspaces)
npm run dev          # Start development with hot-reload (runs kitchensink example + admin-ui + watches packages)
npm run build        # Clean all build artifacts and rebuild packages (excludes examples)
tsc --build -w       # Watch mode for TypeScript compilation across all packages
```

### Testing
```bash
npm test                    # Run all tests (unit + integration)
npm run test:run:unit       # Run unit tests only (uses node --test in packages/)
npm run test:run:integration # Run integration tests (loads .env.tests, then .env as fallback)
node --test path/to/test.ts  # Run a single test file
```

### Package-Level Commands
```bash
cd packages/[package-name]
npm run build       # Build specific package
npm run clean       # Clean build artifacts
npm run test        # Run package tests
npm run test:watch  # Run tests in watch mode
```

### Code Quality
```bash
npm run lint     # Lint and fix code (ESLint + Prettier)
npm run pretest  # Run ESLint without fixing
```

## Architecture Overview

Unchained Engine is a modular e-commerce platform built as a monorepo with npm workspaces.

### Package Hierarchy
```
platform     → Highest level orchestration, combines all packages
    ↓
api          → GraphQL API layer with Express/Fastify adapters, GraphQL Yoga, MCP server
    ↓
core         → Business logic coordination, cross-module services, directors
    ↓
core-*       → Domain-specific modules (users, products, orders, payments, delivery, etc.)
    ↓
infrastructure → Base utilities (store, events, logger, utils, roles, file-upload)
```

### Key Packages
- **@unchainedshop/platform**: Complete engine bundle - main entry point combining api, core, plugins, and infrastructure
- **@unchainedshop/api**: GraphQL API with server adapters (Express, Fastify), MCP server, and session management
- **@unchainedshop/core**: Orchestrates all core-* modules, provides cross-module services and directors
- **@unchainedshop/plugins**: Plugin collection for payment, delivery, pricing, and warehousing
- **@unchainedshop/store**: Drizzle ORM storage layer (SQLite/Turso) - exports db utilities and FTS helpers
- **Infrastructure packages**: events, logger, utils, roles, file-upload

### Plugin Architecture (Director/Adapter Pattern)
- **Directors** manage collections of adapters (e.g., `PaymentDirector`, `DeliveryDirector`)
- **Adapters** implement specific behaviors (e.g., `StripeAdapter`, `PostAdapter`)
- Plugins self-register when imported via `director.registerAdapter()`
- Directors located in `packages/core/src/directors/`

### Core Module Pattern
Each core-* module follows a consistent structure:
```
packages/core-[module]/src/
├── db/
│   ├── schema.ts    # Drizzle ORM schema with typed interfaces
│   ├── index.ts     # Idempotent table creation (CREATE TABLE IF NOT EXISTS)
│   └── fts.ts       # FTS5 full-text search setup (where applicable)
└── module/
    └── configure[Module]Module.ts  # Business logic and queries
```

### Cross-Module Services
The `@unchainedshop/core` package provides services that orchestrate across multiple modules:
- Located in `packages/core/src/services/`
- Examples: `checkoutOrder`, `processOrder`, `searchProducts`, `findOrInitCart`
- Services are bound to the Modules object and accessible via `unchainedAPI.services`

### Architectural Constraints
**IMPORTANT**: Respect layer boundaries:
- **DO NOT import `@unchainedshop/store` outside of core-* and infrastructure packages**
- The API layer should only use types from core packages, never direct Drizzle imports
- Database queries and Drizzle-specific logic belong exclusively in core-* modules
- Higher-level packages (api, platform) use module APIs exposed by core packages

### Database Configuration
```bash
# Database URL formats supported by @unchainedshop/store:
DRIZZLE_DB_URL="file:unchained.db"           # Local SQLite file (default)
DRIZZLE_DB_URL="file::memory:"               # In-memory SQLite (testing)
DRIZZLE_DB_URL="libsql://your-db.turso.io"   # Turso cloud (requires DRIZZLE_AUTH_TOKEN)
```

### TypeScript Configuration
- Uses TypeScript project references for incremental builds
- All packages build to `lib/` directory with declaration files
- Run `tsc --build` from root to build all packages respecting dependencies

### API Server Frameworks
```typescript
import { ... } from '@unchainedshop/api/express'  // Express adapter
import { ... } from '@unchainedshop/api/fastify'  // Fastify adapter
```

### Development Workflow
1. Most development happens in `packages/` directory
2. Examples in `examples/` demonstrate use cases (kitchensink, minimal, oidc, ticketing)
3. Integration tests in `tests/` directory, unit tests within each package
4. `npm run dev` runs admin-ui, kitchensink example, and watches all packages

### Environment Configuration
- Integration tests: `.env.tests` with `.env` as fallback
- Node.js 22+ required (see .nvmrc)
- SQLite (default) or Turso for cloud deployments
