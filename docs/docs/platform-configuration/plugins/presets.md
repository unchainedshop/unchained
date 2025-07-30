---
sidebar_position: 2
title: Plugin Presets
---

# Plugin Presets

Unchained Engine provides several pre-configured plugin bundles (presets) that make it easy to get started with different configurations. These presets automatically import and configure commonly used plugins for specific use cases.

## Available Presets

### Base Preset (`@unchainedshop/plugins/presets/base`)

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

**Delivery:**
- Pick-Mup delivery service

**Pricing:**
- Swiss tax calculation for products
- Swiss tax calculation for delivery

## Framework-Specific Connectors

Each preset comes with framework-specific connectors that set up HTTP endpoints and webhook handlers:

### Fastify Connectors

- `@unchainedshop/plugins/presets/base-fastify` - GridFS file upload endpoints
- `@unchainedshop/plugins/presets/all-fastify` - Payment webhooks and file endpoints
- `@unchainedshop/plugins/presets/crypto-fastify` - Crypto payment webhooks

### Express Connectors

- `@unchainedshop/plugins/presets/base-express` - GridFS file upload endpoints
- `@unchainedshop/plugins/presets/all-express` - Payment webhooks and file endpoints
- `@unchainedshop/plugins/presets/crypto-express` - Crypto payment webhooks

## Usage Examples

### Minimal Setup with Base Preset

```typescript
import { startPlatform } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';

const platform = await startPlatform({
  modules: baseModules,
});

// Connect HTTP endpoints for file uploads
connectBasePluginsToFastify(fastify);
```

### Full-Featured Setup with All Preset

```typescript
import { startPlatform } from '@unchainedshop/platform';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';

const platform = await startPlatform({
  modules: defaultModules,
});

// Connect payment webhooks and file endpoints
connectDefaultPluginsToFastify(fastify, platform);
```

### Crypto-Focused Setup

```typescript
import { startPlatform } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import cryptoModules from '@unchainedshop/plugins/presets/crypto.js';
import connectCryptoToFastify from '@unchainedshop/plugins/presets/crypto-fastify.js';

const platform = await startPlatform({
  modules: {
    ...baseModules,
    ...cryptoModules,
  },
});

// Connect crypto payment webhooks
connectCryptoToFastify(fastify, platform.unchainedAPI);
```

## Customizing Presets

You can extend presets by importing additional plugins or creating your own combinations:

```typescript
import baseModules from '@unchainedshop/plugins/presets/base.js';
import '@unchainedshop/plugins/payment/stripe/index.js';
import '@unchainedshop/plugins/worker/twilio.js';

// Base preset + Stripe + Twilio SMS
const platform = await startPlatform({
  modules: baseModules,
});
```

## Environment Variables

Many plugins in the presets can be configured through environment variables:

```bash
# File storage paths
GRIDFS_PUT_SERVER_PATH=/gridfs/:directoryName/:fileName

# Payment webhook paths
STRIPE_WEBHOOK_PATH=/payment/stripe
PAYREXX_WEBHOOK_PATH=/payment/payrexx
PFCHECKOUT_WEBHOOK_PATH=/payment/postfinance-checkout
DATATRANS_WEBHOOK_PATH=/payment/datatrans/webhook
APPLE_IAP_WEBHOOK_PATH=/payment/apple-iap
SAFERPAY_WEBHOOK_PATH=/payment/saferpay/webhook
CRYPTOPAY_WEBHOOK_PATH=/payment/cryptopay/webhook
```

## Best Practices

1. **Start with Base**: Begin with the base preset and add plugins as needed
2. **Use All for Development**: The all preset is great for development and testing all features
3. **Production Optimization**: In production, use only the plugins you need for better performance
4. **Framework Consistency**: Always use the matching framework connector (Fastify or Express)
5. **Environment Configuration**: Configure plugins through environment variables for flexibility