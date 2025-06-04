# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm install          # Install all dependencies (uses npm workspaces)
npm run dev          # Start development with hot-reload (runs kitchensink example + watches packages)
npm run build -ws    # Build all TypeScript packages
npm run build        # Clean all build artifacts and rebuild all packages without examples
```

### Testing
```bash
npm test             # Run all tests (unit + integration)
npm run test:unit    # Run unit tests only
```

### Code Quality
```bash
npm run lint         # Lint and fix code (ESLint + Prettier)
npm run pretest      # Run ESLint without fixing
```

## Architecture Overview

Unchained Engine is a modular e-commerce platform built as a monorepo with npm workspaces.

### Package Hierarchy
```
platform     → Highest level orchestration, combines all packages
    ↓
api          → GraphQL API layer, defines schema and resolvers  
    ↓
core         → Business logic coordination, cross-module services, integrates core modules
    ↓
core-*       → Domain-specific modules (orders, products, users, etc.)
    ↓
infrastructure → Base utilities (mongodb, events, logger, utils)
```

### Key Packages
- **@unchainedshop/platform**: Complete engine bundle with all features
- **@unchainedshop/api**: GraphQL API implementation
- **@unchainedshop/core**: Core business logic and module integration
- **@unchainedshop/plugins**: Plugin system with payment/delivery/pricing adapters

### Plugin Architecture
The plugin system uses a Director/Adapter pattern:
- **Directors** manage collections of adapters (e.g., PaymentDirector)
- **Adapters** implement specific behaviors (e.g., StripeAdapter)
- Plugins self-register when imported
- Configuration happens through director.registerAdapter()

### Module Pattern
Each core module encapsulates:
- Database collections and schemas
- Business logic services
- Configuration options
- Migration support

Example: `core-orders` module provides OrdersModule with collections, services, and configuration.

### Development Workflow
1. Most development happens in `packages/` directory
2. Examples in `examples/` demonstrate different use cases
3. Tests in `tests/` validate functionality
4. The `npm run dev` command watches packages and runs kitchensink example

### Environment Configuration
- Use `.env` files for local configuration
- Default values in `.env.defaults`
- Node.js 22+ required (see .nvmrc)
- MongoDB required (or use MongoDB Memory Server for testing)
 No newline at end of file
