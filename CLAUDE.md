# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm install          # Install all dependencies (uses npm workspaces)
npm run dev          # Start development with hot-reload (runs kitchensink example + admin-ui + watches packages)
npm run build        # Clean all build artifacts and rebuild packages (excludes examples)
npm run dev:watch    # Watch mode for TypeScript compilation across all packages
```

### Testing
```bash
npm run test                    # Run all tests (unit + integration)
npm run test:run:unit       # Run unit tests only (uses node --test in packages/)
npm run test:run:integration # Run integration tests (uses kitchensink example + tests/)
node --no-warnings --env-file .env.tests --env-file-if-exists=.env --test-isolation=none --test-force-exit --test-global-setup=tests/helpers.js --test --test-concurrency=1 path/to/test.ts  # Run a single integration test file (run from monorepo root directory)
node --test path/to/test.ts # Run a single unit test file
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

## Import Conventions

### Relative Imports
- **MUST** use `.ts` file extensions for all relative imports
- **MUST NOT** omit file extensions in relative imports

```typescript
// ✓ Correct
import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection.ts';
import seed from './seed.ts';

// ✗ Incorrect
import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection';
```

### Package Imports
- **MUST** use package name without extensions for workspace packages
- **MAY** import from package subpaths using package.json exports

```typescript
// ✓ Package imports
import { createLogger } from '@unchainedshop/logger';
import { startPlatform } from '@unchainedshop/platform';
```

### Rationale
- Native Node.js 22+ ESM TypeScript execution
- TypeScript config: `"allowImportingTsExtensions": true`, `"module": "NodeNext"`
- No compilation required for development/testing: `node --watch src/file.ts`, `node --test path/to/test.ts`

## Code Modification Practices

### Script Usage Constraints
- **DO NOT** create standalone scripts (e.g., Python, Node.js, custom executables) to modify code files
- **DO** use find-and-replace patterns that can be executed directly as sh/bash commands

```bash
# ✓ Acceptable - Direct bash/sh commands for find and replace
sed -i '' 's/oldPattern/newPattern/g' file.ts
find packages/ -name "*.ts" -exec sed -i '' 's/oldImport/newImport/g' {} +
grep -rl "pattern" packages/ | xargs sed -i '' 's/pattern/replacement/g'

# ✗ Not acceptable - Standalone scripts to modify code
node transform-code.js
python refactor.py
./custom-migration-script.sh
```

### Rationale
- Keeps modifications transparent and auditable
- Avoids introducing one-off tooling dependencies
- Ensures changes can be reviewed and understood at a glance
- Standard shell tools (sed, grep, find, awk) are universally available

### Type Definition Patterns
- **DO NOT** create standalone `types.ts` files for shared TypeScript types
- **DO** place types in the most coherent implementation file that can be accessed by all callers
- **EXCEPTION**: External API contract types (like payment gateway APIs) may use a dedicated types file within their module

```typescript
// ✓ Correct - Types defined in implementation file
// packages/core-orders/src/orders.ts
export interface Order { ... }
export type OrderStatus = 'pending' | 'confirmed' | 'shipped';

// ✗ Incorrect - Separate types file for internal types
// packages/core-orders/src/types.ts
export interface Order { ... }
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
infrastructure → Base utilities (mongodb, events, logger, utils, roles, file-upload)
```

### Key Packages
- **@unchainedshop/platform**: Complete engine bundle - the main entry point bundling api, core, plugins, and infrastructure
- **@unchainedshop/api**: GraphQL API with server adapters (Express, Fastify), MCP server integration, and session management
- **@unchainedshop/core**: Orchestrates all core-* modules and provides cross-module services
- **@unchainedshop/plugins**: Plugin system with Directors and Adapters for payment, delivery, pricing, and warehousing
- **@unchainedshop/ticketing**: Event ticketing functionality
- **Infrastructure packages**: mongodb, events, logger, utils, roles, file-upload - foundational utilities used across all layers

### Plugin Architecture
The plugin system uses a Director/Adapter pattern:
- **Directors** manage collections of adapters (e.g., PaymentDirector, DeliveryDirector)
- **Adapters** implement specific behaviors (e.g., Stripe payment adapter, GridFS file storage)
- **Explicit registration**: Plugins must be explicitly registered before platform startup
- **Side-effect free**: Plugin files export pure adapter objects without auto-registration

#### Plugin Registration Pattern
Plugins are registered explicitly before starting the platform:

```typescript
// Import preset registration function
import defaultModules, { registerAllPlugins } from '@unchainedshop/plugins/presets/all.js';
import { startPlatform } from '@unchainedshop/platform';

// Register all plugins before starting platform
registerAllPlugins();

// Start platform
const platform = await startPlatform({
  modules: defaultModules,
});
```

#### Available Presets
- **base**: Essential plugins (Invoice payment, Post delivery, core pricing, workers)
  - Use `registerBasePlugins()` from `@unchainedshop/plugins/presets/base.js`
- **all**: Complete plugin bundle (includes base + additional payment gateways, filters, workers)
  - Use `registerAllPlugins()` from `@unchainedshop/plugins/presets/all.js`
- **crypto**: Cryptocurrency plugins (Cryptopay, token minting, rate conversion)
  - Use `registerCryptoPlugins()` from `@unchainedshop/plugins/presets/crypto.js`

#### Registering Individual Plugins
For custom configurations, import and register individual adapters:

```typescript
import { PaymentDirector, ProductDiscountDirector } from '@unchainedshop/core';
import { Stripe } from '@unchainedshop/plugins/payment/stripe/index.js';
import { DiscountHalfPrice } from '@unchainedshop/plugins/pricing/discount-half-price.js';

// Register specific adapters
PaymentDirector.registerAdapter(Stripe);
ProductDiscountDirector.registerAdapter(DiscountHalfPrice);
```

All plugin files export their adapters as named exports, making cherry-picking straightforward.

### Core Module Pattern
Each core-* module follows a consistent pattern:
- **Database collections and schemas**: MongoDB collections with typed interfaces
- **Business logic services**: Module-specific operations and queries
- **Configuration options**: Customizable settings passed during module initialization
- **TypeScript compilation**: Each package builds independently with project references

Example modules: core-orders, core-products, core-users, core-payment, core-delivery, core-assortments, core-filters, core-quotations, core-bookmarks, core-enrollments, core-warehousing, core-worker, core-files, core-events, core-countries, core-currencies, core-languages

### Architectural Constraints
**IMPORTANT**: Respect layer boundaries when working with packages:
- **DO NOT import `@unchainedshop/mongodb` outside of core-* and infrastructure packages**
- The API layer (`@unchainedshop/api`) should only use types from core packages, never direct MongoDB imports
- Database queries and MongoDB-specific logic belong exclusively in core-* modules
- Higher-level packages (api, platform) should use the module APIs exposed by core packages

### TypeScript Configuration
- Uses TypeScript project references for incremental builds
- **MUST** use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` (native ESM)
- **MUST** enable `"allowImportingTsExtensions": true` for .ts imports
- Packages build to `lib/` with declaration files
- Individual packages extend shared base configs

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
- Node.js 22+ required (25 in .nvmrc)
- MongoDB required (or use MongoDB Memory Server for testing)
 No newline at end of file
