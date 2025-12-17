# Unchained Engine

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/unchained?referralCode=ZXvOAF)

Licensed under the EUPL 1.2

[![Bundle Size](https://pkg-size.dev/badge/bundle/1604171)](https://pkg-size.dev/@unchainedshop/platform)
[![CLA assistant](https://cla-assistant.io/readme/badge/unchainedshop/unchained)](https://cla-assistant.io/unchainedshop/unchained)

Unchained Engine is a modular, API-first e-commerce platform built as a monorepo with npm workspaces. It provides a complete solution for building custom e-commerce applications with GraphQL APIs, extensible plugin architecture, and support for modern use cases like subscriptions, quotations, and tokenized products.

### **[View Documentation](https://docs.unchained.shop)**

## Quickstart

### Prerequisites

- Node.js >=22 (see [.nvmrc](.nvmrc))
- MongoDB (or use MongoDB Memory Server for development)

### Create a New Project

```bash
npm init @unchainedshop
```

Then navigate to http://localhost:4000/ to view the welcome screen. Login with:
- **User:** admin@unchained.local
- **Password:** password

### Run Local AI for Copilot

A minimum of 24GB VRAM is needed for this.

```bash
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
```

## Package Architecture

Unchained Engine is organized in a hierarchical structure:

```
platform     → Highest level orchestration, combines all packages
    ↓
api          → GraphQL API layer with Express/Fastify adapters
    ↓
core         → Business logic coordination, integrates all core-* modules
    ↓
core-*       → Domain-specific modules (users, products, orders, etc.)
    ↓
infrastructure → Base utilities (mongodb, events, logger, utils, roles)
```

## Packages

### Platform & API

| Package | Description |
|---------|-------------|
| [@unchainedshop/platform](packages/platform/README.md) | Complete engine bundle - main entry point combining api, core, plugins, and infrastructure |
| [@unchainedshop/api](packages/api/README.md) | GraphQL API with Express/Fastify adapters and MCP server for AI integrations |
| [@unchainedshop/core](packages/core/README.md) | Core orchestration with business services, directors, and bulk import |

### Core Domain Modules

Business logic modules for e-commerce functionality:

| Package | Description |
|---------|-------------|
| [@unchainedshop/core-products](packages/core-products/README.md) | Product management with pricing, media, reviews, and variations |
| [@unchainedshop/core-orders](packages/core-orders/README.md) | Order lifecycle including positions, payments, deliveries, and discounts |
| [@unchainedshop/core-users](packages/core-users/README.md) | User accounts, authentication, profiles, and WebAuthn support |
| [@unchainedshop/core-payment](packages/core-payment/README.md) | Payment provider management and credentials |
| [@unchainedshop/core-delivery](packages/core-delivery/README.md) | Delivery provider management and shipping methods |
| [@unchainedshop/core-assortments](packages/core-assortments/README.md) | Category management with hierarchical structures |
| [@unchainedshop/core-filters](packages/core-filters/README.md) | Product filtering and faceted search |
| [@unchainedshop/core-warehousing](packages/core-warehousing/README.md) | Inventory, stock management, and token surrogates |
| [@unchainedshop/core-enrollments](packages/core-enrollments/README.md) | Subscription/enrollment management |
| [@unchainedshop/core-quotations](packages/core-quotations/README.md) | Quote requests and proposal workflows |
| [@unchainedshop/core-bookmarks](packages/core-bookmarks/README.md) | User bookmark/wishlist functionality |
| [@unchainedshop/core-files](packages/core-files/README.md) | File metadata storage and URL management |
| [@unchainedshop/core-events](packages/core-events/README.md) | Event history persistence and analytics |
| [@unchainedshop/core-worker](packages/core-worker/README.md) | Background job queue and processing |
| [@unchainedshop/core-countries](packages/core-countries/README.md) | Country management with ISO codes |
| [@unchainedshop/core-currencies](packages/core-currencies/README.md) | Currency management and blockchain support |
| [@unchainedshop/core-languages](packages/core-languages/README.md) | Language management for i18n |

### Infrastructure

Foundational utilities used across all layers:

| Package | Description |
|---------|-------------|
| [@unchainedshop/mongodb](packages/mongodb/README.md) | MongoDB database abstraction with utilities and DocumentDB compatibility |
| [@unchainedshop/events](packages/events/README.md) | Event emitter abstraction with pluggable adapters (Redis, Kafka, etc.) |
| [@unchainedshop/logger](packages/logger/README.md) | High-performance logging with JSON/human-readable formats |
| [@unchainedshop/utils](packages/utils/README.md) | Common utilities, locale helpers, and Director/Adapter base classes |
| [@unchainedshop/roles](packages/roles/README.md) | Role-based access control (RBAC) system |
| [@unchainedshop/file-upload](packages/file-upload/README.md) | File upload abstraction with pluggable storage backends |

### Extensions

| Package | Description |
|---------|-------------|
| [@unchainedshop/plugins](packages/plugins/README.md) | Official plugin collection for payment, delivery, pricing, and more |
| [@unchainedshop/ticketing](packages/ticketing/README.md) | Event ticketing with PDF generation and Apple/Google Wallet passes |

### Admin UI

| Package | Description |
|---------|-------------|
| [admin-ui](admin-ui/README.md) | Next.js admin interface for managing the e-commerce platform |

### Examples

| Example | Description |
|---------|-------------|
| [Kitchensink (Fastify)](examples/kitchensink/README.md) | Full-featured example with Fastify, all plugins, ticketing, and AI integration |
| [Kitchensink (Express)](examples/kitchensink-express/README.md) | Full-featured example with Express, MCP server, and AI integration |
| [Ticketing](examples/ticketing/README.md) | Event ticketing with PDF and wallet passes |
| [Minimal](examples/minimal/README.md) | Minimal setup example |
| [OIDC](examples/oidc/README.md) | OpenID Connect authentication example |

## Plugin Architecture

Unchained uses a Director/Adapter pattern for extensibility. Directors manage collections of adapters that implement specific behaviors.

### Available Directors

| Director | Purpose | Example Adapters |
|----------|---------|------------------|
| `PaymentDirector` | Payment processing | Stripe, PayPal, Invoice |
| `DeliveryDirector` | Shipping/delivery | Post, Pickup, Digital |
| `WarehousingDirector` | Inventory management | Store, ETH Minter |
| `WorkerDirector` | Background jobs | Email, SMS, HTTP Request |
| `FilterDirector` | Product search | Strict Equal, Local Search |
| `ProductPricingDirector` | Product pricing | Catalog Price, Discounts |
| `OrderPricingDirector` | Order totals | Items, Delivery, Payment |
| `MessagingDirector` | Notifications | Email templates, SMS |

See the [Core README](packages/core/README.md) for detailed documentation on creating custom adapters.

## Available Plugins

The [@unchainedshop/plugins](packages/plugins/README.md) package includes:

### Payment
- Stripe, PayPal, Braintree, Datatrans, Saferpay
- Payrexx, Cryptopay, Apple IAP
- Invoice (standard and prepaid)

### Delivery
- Post (manual shipping), Store pickup, Digital delivery

### Pricing
- Product catalog pricing, Currency conversion, Tax calculation (Swiss VAT)
- Order-level and product-level discounts, Price rounding

### File Storage
- MongoDB GridFS, MinIO/S3-compatible storage

### Workers
- Email (Nodemailer), SMS (Twilio, Bulkgate), Push notifications
- Currency rate updates (ECB, Coinbase), Bulk import

### Events
- Node.js EventEmitter, Redis pub/sub, AWS EventBridge

## Development

### Commands

```bash
npm install          # Install all dependencies
npm run dev          # Start development with hot-reload
npm run build        # Build all packages
npm test             # Run all tests
npm run lint         # Lint and fix code
```

### Testing

```bash
npm run test:run:unit         # Run unit tests only
npm run test:run:integration  # Run integration tests
node --test path/to/test.ts   # Run a single test file
```

### Project Structure

```
unchained/
├── packages/           # All npm packages
│   ├── platform/       # Main entry point
│   ├── api/            # GraphQL API
│   ├── core/           # Business logic orchestration
│   ├── core-*/         # Domain modules
│   ├── plugins/        # Official plugins
│   ├── ticketing/      # Ticketing extension
│   └── ...             # Infrastructure packages
├── examples/           # Example implementations
│   ├── kitchensink/    # Full-featured example
│   ├── minimal/        # Minimal setup
│   └── ...
└── tests/              # Integration tests
```

## Migration Guide

See [MIGRATION.md](MIGRATION.md) for upgrade instructions between major versions.

## Resources

- [Changelog](CHANGELOG.md)
- [Benchmarks](BENCHMARKS.md)

## Contributing

Please see our [Contribution Guidelines](CONTRIBUTING.md).

## Code of Conduct

See our [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## License

EUPL-1.2
