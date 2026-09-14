[![npm version](https://img.shields.io/npm/v/@unchainedshop/plugins.svg)](https://npmjs.com/package/@unchainedshop/plugins)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/plugins

Official plugin collection for the Unchained Engine. Provides ready-to-use adapters for payment, delivery, pricing, file storage, workers, and more.

## Installation

```bash
npm install @unchainedshop/plugins
```

## Available Plugins

### Payment Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Invoice | `payment/invoice` | Simple invoice-based payment |
| Invoice Prepaid | `payment/invoice-prepaid` | Prepaid invoice payment |
| Stripe | `payment/stripe` | Stripe payment integration |
| Datatrans V2 | `payment/datatrans-v2` | Datatrans payment gateway |
| Saferpay | `payment/saferpay` | Saferpay payment gateway |
| Payrexx | `payment/payrexx` | Payrexx payment gateway |
| Postfinance Checkout | `payment/postfinance-checkout` | Postfinance Checkout payment gateway |
| Apple IAP | `payment/apple-iap` | Apple In-App Purchase |
| Cryptopay | `payment/cryptopay` | Cryptocurrency payments |

### Delivery Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Post | `delivery/post` | Standard postal delivery |
| Stores | `delivery/stores` | Store pickup delivery |
| Send Message | `delivery/send-message` | Digital delivery via messaging |

### Pricing Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Product Catalog Price | `pricing/product-catalog-price` | Base catalog pricing |
| Product Price Rate Conversion | `pricing/product-price-rateconversion` | Currency conversion |
| Product Discount | `pricing/product-discount` | Product-level discounts |
| Order Items | `pricing/order-items` | Order item pricing |
| Order Delivery | `pricing/order-delivery` | Delivery pricing |
| Order Payment | `pricing/order-payment` | Payment fee pricing |
| Order Discount | `pricing/order-discount` | Order-level discounts |
| Free Delivery | `pricing/free-delivery` | Free delivery conditions |
| Free Payment | `pricing/free-payment` | Free payment processing |
| Product Swiss Tax | `pricing/product-swiss-tax` | Swiss VAT on products |
| Delivery Swiss Tax | `pricing/delivery-swiss-tax` | Swiss VAT on delivery |

### Filter Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Strict Equal | `filters/strict-equal` | Exact match filtering |
| Local Search | `filters/local-search` | Full-text search |

### File Storage Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| GridFS | `files/gridfs` | MongoDB GridFS storage |
| MinIO | `files/minio` | MinIO/S3-compatible storage |

### Worker Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Email | `worker/email` | Email sending worker |
| Heartbeat | `worker/heartbeat` | Keep-alive heartbeat |
| HTTP Request | `worker/http-request` | HTTP request worker |
| Bulk Import | `worker/bulk-import` | Bulk data import |
| External | `worker/external` | External service calls |
| Twilio | `worker/twilio` | Twilio SMS integration |
| Push Notification | `worker/push-notification` | Push notifications |
| Update ECB Rates | `worker/update-ecb-rates` | ECB exchange rates |
| Update Coinbase Rates | `worker/update-coinbase-rates` | Crypto exchange rates |
| Update Token Ownership | `worker/update-token-ownership` | NFT ownership sync |
| Zombie Killer | `worker/zombie-killer` | Stale job cleanup |
| Error Notifications | `worker/error-notifications` | Error alerting |

### Event Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Node Event Emitter | `events/node-event-emitter` | Default Node.js emitter |
| Redis | `events/redis` | Redis pub/sub |
| AWS EventBridge | `events/aws-eventbridge` | AWS EventBridge |

### Warehousing Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Store | `warehousing/store` | Basic inventory |
| ETH Minter | `warehousing/eth-minter` | Ethereum NFT minting |

### Other Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Licensed Enrollment | `enrollments/licensed` | License-based subscriptions |
| Manual Quotation | `quotations/manual` | Manual quote handling |

## Usage

Import and register plugins during platform initialization:

```typescript
import { startPlatform } from '@unchainedshop/platform';
import { pluginRegistry } from '@unchainedshop/core';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe';

registerBasePlugins();
pluginRegistry.register(StripePlugin);

const platform = await startPlatform({
  // ...
});
```

Plugins must be registered explicitly before `startPlatform()`. Importing them alone does not register adapters or routes. Use named `XPlugin` exports (or the default plugin export), or the `registerBasePlugins()`, `registerAllPlugins()`, and `registerCryptoPlugins()` preset functions. Import package subpaths without a file extension.

Event adapters use `setEmitAdapter()` from `@unchainedshop/events`; see their [Node Event Emitter example](src/events/node-event-emitter.ts). The base and all presets configure the default event emitter; the crypto preset supplements a base setup. Install the optional peer dependencies needed by the plugins you enable; see [package.json](package.json).

## Security

### Payment Plugin Security

Payment integrations provide provider-specific tokenization or hosted-payment flows:

| Plugin | Security Method |
|--------|-----------------|
| Stripe | PaymentIntent/SetupIntent tokenization |
| Datatrans | Secure Fields with HMAC-SHA-256 signatures |
| Saferpay | Redirect with SHA-256 transaction signatures |
| Cryptopay | BIP-32 HD wallet address derivation |

**Signature Algorithms:**
- HMAC-SHA-256: Datatrans, Payrexx, GridFS file uploads
- HMAC-SHA-512: Postfinance Checkout API request authentication
- SHA-256: Saferpay

### Cryptographic runtime compatibility

Cryptographic dependencies vary by plugin. Cryptocurrency adapters use blockchain-specific algorithms and optional JavaScript cryptography libraries; enabling FIPS mode in Node.js does not validate every plugin or dependency.

See [SECURITY.md](../../SECURITY.md) for complete security documentation.

## Postfinance Checkout

Postfinance Checkout is included in the normal build and exports `PostfinanceCheckoutPlugin` from `@unchainedshop/plugins/payment/postfinance-checkout`. It uses the bundled fetch-based API client. Set `PFCHECKOUT_SPACE_ID`, `PFCHECKOUT_USER_ID`, `PFCHECKOUT_SECRET`, `PFCHECKOUT_SUCCESS_URL`, and `PFCHECKOUT_FAILED_URL` before startup; its initialization hook skips the plugin's adapters and routes if these values are missing.

## License

EUPL-1.2
