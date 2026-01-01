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
npm run test:run:integration # Run integration tests (uses kitchensink example + tests/)
node --test path/to/test.ts  # Run a single test file
```

### Package-Level Commands
Individual packages support these scripts:
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
core         → Business logic coordination, integrates all core-* modules
    ↓
core-*       → Domain-specific modules (users, products, orders, payments, delivery, etc.)
    ↓
infrastructure → Base utilities (store, events, logger, utils, roles, file-upload)
```

### Key Packages
- **@unchainedshop/platform**: Complete engine bundle - the main entry point bundling api, core, plugins, and infrastructure
- **@unchainedshop/api**: GraphQL API with server adapters (Express, Fastify), MCP server integration, and session management
- **@unchainedshop/core**: Orchestrates all core-* modules and provides cross-module services
- **@unchainedshop/plugins**: Plugin system with Directors and Adapters for payment, delivery, pricing, and warehousing
- **@unchainedshop/ticketing**: Event ticketing functionality
- **Infrastructure packages**: store, events, logger, utils, roles, file-upload - foundational utilities used across all layers

### Plugin Architecture
The plugin system uses a Director/Adapter pattern:
- **Directors** manage collections of adapters (e.g., PaymentDirector)
- **Adapters** implement specific behaviors (e.g., StripeAdapter)
- Plugins self-register when imported
- Configuration happens through director.registerAdapter()

### Core Module Pattern
Each core-* module follows a consistent pattern:
- **Database schemas**: Drizzle ORM schemas in `src/db/schema.ts` with typed interfaces
- **Schema initialization**: Idempotent table creation in `src/db/index.ts`
- **Full-text search**: FTS5 virtual tables in `src/db/fts.ts` (where applicable)
- **Business logic services**: Module-specific operations and queries
- **Configuration options**: Customizable settings passed during module initialization
- **TypeScript compilation**: Each package builds independently with project references

Example modules: core-orders, core-products, core-users, core-payment, core-delivery, core-assortments, core-filters, core-quotations, core-bookmarks, core-enrollments, core-warehousing, core-worker, core-files, core-events, core-countries, core-currencies, core-languages

### Architectural Constraints
**IMPORTANT**: Respect layer boundaries when working with packages:
- **DO NOT import `@unchainedshop/store` outside of core-* and infrastructure packages**
- The API layer (`@unchainedshop/api`) should only use types from core packages, never direct Drizzle imports
- Database queries and Drizzle-specific logic belong exclusively in core-* modules
- Higher-level packages (api, platform) should use the module APIs exposed by core packages

### TypeScript Configuration
- Uses TypeScript project references (tsconfig.json) for incremental builds
- All packages build to `lib/` directory with declaration files
- Run `tsc --build` from root to build all packages respecting dependencies
- Individual packages have isolated TypeScript configurations

### API Structure
The API package supports multiple server frameworks:
- **Express**: Import from `@unchainedshop/api/express`
- **Fastify**: Import from `@unchainedshop/api/fastify`
- **GraphQL Yoga**: Core GraphQL server implementation
- **MCP Server**: Model Context Protocol server for AI integrations

### Development Workflow
1. Most development happens in `packages/` directory
2. Examples in `examples/` demonstrate different use cases (kitchensink, minimal, oidc, ticketing)
3. Integration tests in `tests/` directory validate end-to-end functionality
4. Unit tests live within each package alongside source files
5. The `npm run dev` command runs admin-ui, kitchensink example, and watches all packages

### Environment Configuration
- Use `.env` files for local configuration
- Default values in `.env.defaults`
- Integration tests use `.env.tests` with `.env` as fallback
- Node.js 22+ required (see .nvmrc)
- SQLite (default) or Turso for cloud deployments
- Use `DRIZZLE_DB_URL` for database connection (default: `file:unchained.db`)

 No newline at end of file
