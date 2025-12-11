---
sidebar_position: 3
title: Plugin Presets
sidebar_label: Plugin Presets
description: Pre-configured plugin bundles for quick setup
---

# Plugin Presets

Unchained Engine provides several pre-configured plugin bundles (presets) that make it easy to get started with different configurations. These presets automatically import and configure commonly used plugins for specific use cases.

## Available Presets

### Base Preset (`@unchainedshop/plugins/presets/base`)

boot.ts
```ts
import modules from '@unchainedshop/plugins/presets/base.js';
const platform = await startPlatform({
  modules,
});
connect(app, platform)

// Either:
// a) Load GridFS REST endpoints for Express.js:
import connectPlugins from '@unchainedshop/plugins/presets/base-express.js';
// a) Load GridFS REST endpoints for Fastify:
import connectPlugins from '@unchainedshop/plugins/presets/base-fastify.js';

connectPlugins(app);
```

The base preset includes essential plugins for a minimal e-commerce setup:

**Payment Providers:**
- Invoice payment

**Delivery Methods:**
- Post delivery

**Warehousing:**
- Store warehousing

**Pricing:**
- Free payment pricing
- Free delivery pricing
- Order items pricing
- Order discount pricing
- Order delivery pricing
- Order payment pricing
- Product catalog pricing
- Product discount pricing

**Quotations:**
- Manual quotations

**Enrollments:**
- Licensed enrollments

**Event System:**
- Node.js Event Emitter

**Workers:**
- Bulk import
- Zombie killer (cleanup)
- Message handling
- External service integration
- HTTP request handling
- Heartbeat monitoring
- Email notifications
- Error notifications

**File Storage:**
- GridFS (MongoDB) file storage with modules

### All Preset (`@unchainedshop/plugins/presets/all`)

boot.ts
```ts
import modules from '@unchainedshop/plugins/presets/all.js';
const platform = await startPlatform({
  modules,
});
connect(app, platform)

// Either:
// a) Load all custom API handlers for Express.js:
import connectPlugins from '@unchainedshop/plugins/presets/all-express.js';
// b) Load all custom API handlers for Fastify:
import connectPlugins from '@unchainedshop/plugins/presets/all-fastify.js';

connectPlugins(app);
```

The all preset extends the base preset with additional payment providers, delivery methods, and features:

**Includes everything from Base Preset plus:**

**Additional Payment Providers:**
- Invoice prepaid
- PayPal Checkout
- Apple In-App Purchase
- Saferpay
- Stripe
- PostFinance Checkout
- Datatrans v2
- PayRexx

**Additional Delivery Methods:**
- Send message delivery
- Store pickup

**Search & Filtering:**
- Strict equal filtering
- Local search

**Additional Workers:**
- Twilio SMS
- Bulkgate SMS
- BudgetSMS SMS
- Push notifications
- Enrollment order generator

**Country-Specific Extensions:**
- Switzerland (CH) specific plugins

**Crypto Features:**
- All crypto-related plugins from crypto preset

### Crypto Preset (`@unchainedshop/plugins/presets/crypto`)

boot.ts
```ts
import baseModules from '@unchainedshop/plugins/presets/base.js';
import cryptoModules from '@unchainedshop/plugins/presets/crypto.js';
const platform = await startPlatform({
  modules: {
    ...baseModules,
    ...cryptoModules,
  },
});
connect(app, platform)

// a) Load Crypto API handlers for Express.js:
import connectCryptoPlugins from '@unchainedshop/plugins/presets/crypto-express.js';
import connectPlugins from '@unchainedshop/plugins/presets/base-express.js';
// b) Load Crypto API handlers for Fastify:
import connectCryptoPlugins from '@unchainedshop/plugins/presets/crypto-fastify.js';
import connectPlugins from '@unchainedshop/plugins/presets/base-fastify.js';

// Make sure you load the base plugins too as those are not part of the crypto preset!
connectCryptoPlugins(app);
connectPlugins(app)
```

Specialized preset for cryptocurrency and blockchain functionality:

**Payment Providers:**
- Cryptopay (self-hosted crypto payments)

**Warehousing:**
- Ethereum token minting

**Pricing:**
- Product price rate conversion

**Workers:**
- ECB currency rate updates
- Coinbase currency rate updates
- Token export functionality

### Country-Specific Presets

#### Switzerland (`@unchainedshop/plugins/presets/countries/ch`)

boot.ts
```ts
import modules from '@unchainedshop/plugins/presets/base.js';
 // The CH preset exists only of plugins and doesn't expose any custom modules!
import '@unchainedshop/plugins/presets/countries/ch.js';
const platform = await startPlatform({
  modules,
});
connect(app, platform)

// a) Load Base API handlers for Express.js:
import connectPlugins from '@unchainedshop/plugins/presets/base-express.js';
// b) Load Base API handlers for Fastify:
import connectPlugins from '@unchainedshop/plugins/presets/base-fastify.js';

// Make sure you load the base plugins too as those are not part of the ch preset!
connectPlugins(app)
```

**Delivery:**
- Pick-Mup delivery service

**Pricing:**
- Swiss tax calculation for products
- Swiss tax calculation for delivery

## Plugins Not Included in Presets

Some plugins are **not** automatically loaded by any preset and must be imported explicitly:

**Payment Providers:**
- [Braintree](../plugins/payment/braintree.md) - PayPal-owned payment processor

To use these plugins, import them directly in your project in addition to your chosen preset.

## Best Practices

1. **Start with Base**: Begin with the base preset and add plugins as needed
2. **Use All for Development**: The all preset is great for development and testing all features
3. **Production Optimization**: In production, use only the plugins you need for better performance
4. **Framework Consistency**: Always use the matching framework connector (Fastify or Express)
5. **Environment Configuration**: Configure plugins through environment variables for flexibility