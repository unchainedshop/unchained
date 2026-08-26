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
- **Plugin architecture**: Extensible via plugins and adapter factories
- **Open source**: EUPL-1.2 licensed
- **MongoDB-based**: Flexible document storage

### What frontend frameworks can I use?

Any framework that can make HTTP requests: Next.js, React, Vue/Nuxt, Svelte/SvelteKit, mobile apps (React Native, Flutter), etc. See [Building a Storefront](../guides/building-a-storefront).

### Is Unchained suitable for large-scale deployments?

Yes. Unchained scales horizontally: stateless API (JWT auth), distributed event system (Redis adapter), background job queue, and external file storage (S3/MinIO).

## Setup & Installation

### What are the system requirements?

- Node.js 22+
- MongoDB (optional in development — the engine boots an in-memory server when `MONGO_URL` is unset)

### Do I need MongoDB Atlas or can I use local MongoDB?

Both work. For development, local MongoDB (or the built-in in-memory server) is fine. For production, a managed service like MongoDB Atlas gives you backups, high availability, and monitoring.

### Can I use PostgreSQL instead of MongoDB?

No. Unchained is designed around MongoDB's document model. The flexible schema is a core architectural choice.

### How do I update Unchained?

```bash
npm update @unchainedshop/platform @unchainedshop/api @unchainedshop/plugins
```

Check [MIGRATION.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION.md) for breaking changes between major versions. Database migrations run automatically when the platform boots.

## Development

### How do I extend the GraphQL schema?

Pass `typeDefs` and `resolvers` directly to `startPlatform` — they are appended to the built-in schema:

```typescript
await startPlatform({
  typeDefs: [
    /* GraphQL */ `
      extend type Product {
        customField: String
      }
    `,
  ],
  resolvers: [
    {
      SimpleProduct: {
        customField: ({ meta }) => meta?.customField,
      },
    },
  ],
});
```

See [Extending GraphQL](../extend/graphql) for details.

### How do I add a custom payment provider?

Use the payment provider factory — it registers the adapter for you:

```typescript
import { registerPaymentProvider } from '@unchainedshop/core';

registerPaymentProvider({
  adapterId: 'my-payment',
  charge: async (configuration, context) => {
    const result = await gateway.charge(context.order);
    return { transactionId: result.id };
  },
});
```

See [Plugin Factories](../extend/plugin-factories#payment).

### How do I handle webhooks?

Built-in payment plugins register their webhook routes automatically when registered (e.g. the Stripe plugin listens on `/payment/stripe/webhook`). For custom webhooks, you own the HTTP server — add routes to your Fastify (or Express) instance in your boot file:

```typescript
fastify.post('/webhooks/my-gateway', async (request, reply) => {
  // verify signature, then act on request.body
  return reply.send({ received: true });
});
```

### How do I run background jobs?

Register a worker via the [`registerWorker` factory](../extend/plugin-factories#workers), then schedule work through the worker module:

```typescript
await unchainedAPI.modules.worker.addWork({
  type: 'MY_JOB_TYPE',
  input: { /* data */ },
  scheduled: new Date(),
  retries: 5,
});
```

See [Worker](../extend/worker).

## Products & Catalog

### What product types are supported?

`SIMPLE_PRODUCT`, `CONFIGURABLE_PRODUCT` (variants), `BUNDLE_PRODUCT`, `PLAN_PRODUCT` (subscriptions), and `TOKENIZED_PRODUCT` (NFT/token-backed).

### How do I handle product variants?

Create a `CONFIGURABLE_PRODUCT`, link `SIMPLE_PRODUCT`s to it with `addProductAssignment` and variation vectors. See [Create your first Product](../quick-start/first-product) for the full walkthrough.

### How do I implement product search?

See [Search and Filtering](../guides/search-and-filtering).

## Orders & Checkout

### How does the checkout flow work?

Cart → delivery/payment provider selection → `checkoutCart` → payment confirmation → order `CONFIRMED`. See [Order Lifecycle](../concepts/order-lifecycle) and the [Checkout Implementation guide](../guides/checkout-implementation).

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

Use `PLAN_PRODUCT`s. When ordered, an Enrollment is created that generates recurring orders. See [Enrollments](../extend/enrollment).

## Pricing

### How is pricing calculated?

Through a chain of pricing adapters (base price, discounts, tax, delivery and payment fees). See [Pricing System](../concepts/pricing-system), [Custom Pricing](../guides/custom-pricing), and [Plugin Factories](../extend/plugin-factories#pricing).

### How do I handle multiple currencies and languages?

See [Multi-Currency Setup](../guides/multi-currency-setup) and [Multi-Language Setup](../guides/multi-language-setup).

## Deployment

### Where can I host Unchained?

- Railway (easiest, one-click template)
- Docker on any cloud or Kubernetes
- Any Node.js 22+ host with MongoDB access

See [Deployment](../deployment/index.md).

### How do I handle database migrations?

Migrations run automatically on startup when the Unchained platform boots. The migration system handles schema updates and data transformations between versions.

## Security

### How is authentication handled?

- Access tokens are HS256-signed JWTs, delivered as an `httpOnly` cookie or accepted via `Authorization: Bearer <token>`
- WebAuthn for passwordless auth
- OIDC for external identity providers

See [Authentication](../concepts/authentication).

### How do I implement role-based access?

Define custom roles at boot via `rolesOptions`:

```typescript
await startPlatform({
  rolesOptions: {
    additionalRoles: {
      support: (role, actions) => {
        role.allow(actions.viewOrders, () => true);
      },
    },
  },
});
```

Assign the role with `modules.users.updateRoles(userId, ['support'])`. See [Permissions](../concepts/permissions).

### Is Unchained PCI compliant?

Unchained doesn't store card data. The bundled payment integrations (Stripe, Datatrans, PostFinance Checkout, Saferpay, Payrexx, and others) reference provider-side transactions and tokens, not card numbers. See [Security](../deployment/security#payment-security).

## Troubleshooting

### Where are the logs?

```bash
# Development
npm run dev  # Console output

# Production
docker logs -f container-name

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

## AI Integration

For questions about the MCP server, Admin Copilot, or connecting AI agents to Unchained, see the [AI Integration FAQ](../ai-integration/ai-faq).
