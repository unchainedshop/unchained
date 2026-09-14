---
sidebar_position: 2
title: FAQ
sidebar_label: FAQ
description: Frequently asked questions about Unchained Engine
---

# Frequently Asked Questions

## General

### What is Unchained Engine?

Unchained Engine is a headless, code-first e-commerce platform built with Node.js. It provides a GraphQL API that any frontend can consume, making it ideal for custom e-commerce solutions.

### What makes Unchained different from other e-commerce platforms?

- **Code-first**: Configure through code, not control panels
- **Headless**: Decoupled from any specific UI
- **Plugin architecture**: Extensible via Director/Adapter pattern
- **Open source**: EUPL-1.2 licensed
- **MongoDB-based**: Flexible document storage

### What frontend frameworks can I use?

Any framework that can make HTTP requests:
- Next.js (most common)
- React
- Vue.js / Nuxt
- Svelte / SvelteKit
- Mobile apps (React Native, Flutter)

### Is Unchained suitable for large-scale deployments?

Yes. Unchained is designed to scale horizontally and has been used in production by businesses processing significant order volumes. Key features for scale:
- Stateless architecture
- Distributed event delivery using a configured emitter
- Background job processing
- External file storage (S3)

## Setup & Installation

### What are the system requirements?

- Node.js 26.8.2 or newer
- MongoDB 6+
- 1GB+ RAM (2GB+ recommended for production)

### Do I need MongoDB Atlas or can I use local MongoDB?

Both work. For development, local MongoDB is fine. For production, MongoDB Atlas is recommended for:
- Automatic backups
- High availability
- Monitoring
- Security

### Can I use PostgreSQL instead of MongoDB?

No. Unchained is designed around MongoDB's document model. The flexible schema is a core architectural choice.

### How do I update Unchained?

```bash
# Update all packages
npm update @unchainedshop/platform

# Check for breaking changes in MIGRATION.md
```

## Development

### How do I extend the GraphQL schema?

Use type extensions and custom resolvers:

```typescript
const customTypeDefs = `
  extend interface Product {
    customField: String
  }
`;

const customResolvers = {
  Product: {
    customField: (product) => product.meta?.customField,
  },
};

await startPlatform({
  typeDefs: [customTypeDefs],
  resolvers: [customResolvers],
});
```

See [Extending GraphQL](../extend/graphql) for details.

### How do I add a custom payment provider?

Create a payment adapter and register it:

```typescript
import { PaymentAdapter, PaymentDirector } from '@unchainedshop/core';

const MyPaymentAdapter = {
  ...PaymentAdapter,
  key: 'my-payment',
  label: 'My Payment',
  version: '1.0.0',
  typeSupported: (type) => type === 'GENERIC',
  actions: (configuration, context) => ({
    ...PaymentAdapter.actions(configuration, context),
    // Override the payment operations for your gateway.
  }),
};

PaymentDirector.registerAdapter(MyPaymentAdapter);
```

See [Payment Plugins](../extend/order-fulfilment/fulfilment-plugins/payment).

### How do I handle webhooks?

Add custom routes to your server:

```typescript
import express from 'express';

const app = express();

app.post('/webhooks/stripe', async (req, res) => {
  // Handle Stripe webhook
});

// Use with Unchained
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
const platform = await startPlatform({});
connect(app, platform);
app.listen(4010);
```

### How do I run background jobs?

Use the Worker system:

```typescript
import { WorkerDirector } from '@unchainedshop/core';

// Schedule a job
await modules.worker.addWork({
  type: 'MY_JOB_TYPE',
  input: { /* data */ },
});

// Jobs are processed automatically
```

See [Worker](../extend/worker).

## Products & Catalog

### What product types are supported?

- **Simple**: Basic products with price
- **Configurable**: Products with variations (size, color)
- **Bundle**: Collections of products
- **Plan**: Subscription products
- **Tokenized**: NFT/token-backed products

### How do I handle product variants?

Use ConfigurableProduct with linked SimpleProducts:

```graphql
mutation CreateConfigurableProduct {
  createProduct(product: { type: CONFIGURABLE_PRODUCT }) {
    _id
  }
}
```

```graphql
mutation CreateVariant {
  createProduct(product: { type: SIMPLE_PRODUCT }) {
    _id
  }
}
```

```graphql
mutation LinkVariant {
  addProductAssignment(
    proxyId: "configurable-id"
    productId: "simple-id"
    vectors: [
      { key: "size", value: "M" }
      { key: "color", value: "blue" }
    ]
  ) {
    _id
  }
}
```

### How do I implement product search?

Use the built-in search or integrate external search:

```graphql
query SearchProducts {
  searchProducts(queryString: "t-shirt", filterQuery: [
    { key: "category", value: "clothing" }
  ]) {
    products { _id }
    filteredProductsCount
  }
}
```

See [Search and Filtering](../guides/search-and-filtering).

## Orders & Checkout

### How does the checkout flow work?

1. User authenticates (guest or registered)
2. Add products to cart
3. Set delivery provider and address
4. Set payment provider
5. Call `checkoutCart`
6. Payment webhook confirms payment
7. Order transitions to CONFIRMED

See [Order Lifecycle](../concepts/order-lifecycle).

### Can customers checkout as guests?

Yes:

```graphql
mutation LoginAsGuest {
  loginAsGuest {
    _id
    tokenExpires
  }
}
```

Guests can later convert to registered users without losing their order history.

### How do I implement subscriptions?

Use Plan products with the Enrollment system:

```graphql
mutation CreatePlanProduct {
  createProduct(product: { type: PLAN_PRODUCT }) {
    _id
  }
}
```

When ordered, an Enrollment is created that generates recurring orders.

## Pricing

### How is pricing calculated?

Through a chain of pricing adapters:
1. Base price
2. Discounts
3. Tax
4. Delivery fees
5. Payment fees

See [Pricing System](../concepts/pricing-system).

### How do I implement custom pricing logic?

Compose the `ProductPricingAdapter` object from `@unchainedshop/core`, override `actions(params)`, and write rows to `baseActions.resultSheet()`. Return `baseActions.calculate()` so the director can append your rows. Use `addDiscount()` with a discount ID for discount rows.

See the [complete pricing example](../concepts/director-adapter-pattern.md#pricing-directors).

### How do I handle multiple currencies?

1. Configure currencies in Admin UI
2. Set prices per currency or use exchange rates
3. Query with desired currency:

```graphql
query ProductPrice {
  product(productId: "...") {
    ... on SimpleProduct {
      simulatedPrice(currencyCode: "EUR") {
        amount
        currencyCode
      }
    }
  }
}
```

See [Multi-Currency Setup](../guides/multi-currency-setup).

## Internationalization

### How do I support multiple languages?

1. Configure languages in Admin UI
2. Add translations to entities
3. Query with Accept-Language header

```graphql
# Headers: Accept-Language: de
query {
  product(productId: "...") {
    texts {
      title  # Returns German title
    }
  }
}
```

See [Multi-Language Setup](../guides/multi-language-setup).

## Deployment

### Where can I host Unchained?

- Railway (easiest)
- Docker on any cloud (AWS, GCP, Azure)
- Kubernetes
- Vercel (for storefront, not engine)

### What's the recommended production setup?

- Node.js matching the repository `.nvmrc` on a container platform
- MongoDB Atlas for database
- S3/MinIO for file storage
- A configured distributed event emitter when running multiple instances
- CDN for static assets

See platform-specific documentation for deployment guides.

### How do I handle database migrations?

Migrations run automatically on startup when the Unchained platform boots. The migration system handles schema updates and data transformations between versions.

## Security

### How is authentication handled?

- Signed session cookies with MongoDB-backed sessions
- Generated bearer access tokens for API integrations
- WebAuthn for passwordless auth
- OIDC for external identity providers

### How do I implement role-based access?

Use the built-in roles system after platform initialization (the `Role` constructor registers the role):

```typescript
import { Roles, Role } from '@unchainedshop/roles';

const customRole = new Role('support');
customRole.allow('viewOrders', async () => true);

// Assign to user
await modules.users.updateRoles(userId, ['support']);
```

### Is Unchained PCI compliant?

Unchained doesn't store card data directly. Use payment providers (Stripe, PayPal) that handle PCI compliance. Payment adapter integrations use tokens, not card numbers.

## Troubleshooting

### Where are the logs?

```bash
# Development
npm run dev  # Console output

# Production
docker logs -f container-name
pm2 logs

# Debug mode
DEBUG=unchained:* npm run dev
```

### How do I reset the database?

```bash
# Drop database
mongosh --eval "db.dropDatabase()" unchained

# Restart server (will recreate collections)
npm run dev
```

### How do I get support?

1. Check [Troubleshooting](.)
2. Search [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
3. Ask in [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
4. For enterprise support, contact support@unchained.shop
