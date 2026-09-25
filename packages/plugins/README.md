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
| Product EU Tax | `pricing/product-eu-tax` | EU destination VAT on products (opt-in `registerEuTaxPlugins`) |
| Delivery EU Tax | `pricing/delivery-eu-tax` | EU destination VAT on delivery |
| Product UK Tax | `pricing/product-uk-tax` | UK VAT on products (opt-in `registerUkTaxPlugins`) |
| Delivery UK Tax | `pricing/delivery-uk-tax` | UK VAT on delivery |
| Product US Sales Tax | `pricing/product-us-sales-tax` | US sales tax on products (opt-in `registerUsSalesTaxPlugins`) |
| Delivery US Sales Tax | `pricing/delivery-us-sales-tax` | US sales tax on delivery |
| 100 Off Discount | `pricing/discount-100-off` | Example order discount (not in any preset) |
| Half Price Manual Discount | `pricing/discount-half-price-manual` | Example manual product discount (not in any preset) |

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
| Temp Upload | `files/temp-upload` | Route for temporary uploads (e.g. bulk import payloads) |

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
| BudgetSMS | `worker/budgetsms` | BudgetSMS SMS integration |
| BulkGate | `worker/bulkgate` | BulkGate SMS integration |
| Bulk Export | `worker/bulk-export` | Bulk data export |
| Enrollment Order Generator | `worker/enrollment-order-generator` | Generates orders from enrollments |
| Export Token | `worker/export-token` | Holds the state of token minting/export |
| GC Guests | `worker/gc-guests` | Garbage-collects guest users |
| Invalidate Carts | `worker/invalidate-carts` | Recalculates open carts |
| Message | `worker/message` | Renders a message template and starts the delivery jobs |

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
| ERC Metadata | `warehousing/erc-metadata` | ERC token metadata routes (`/erc-metadata/...`) |

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

Plugins must be registered explicitly before `startPlatform()`. Importing them alone does not register adapters or routes. Use named `XPlugin` exports (or the default plugin export), or the preset functions `registerBasePlugins()`, `registerAllPlugins()`, `registerCryptoPlugins()` and the opt-in country tax presets (`presets/countries/{ch,eu,uk,us}`). `registerAllPlugins()` includes the crypto and Swiss tax presets and needs the optional crypto peers. Presets cannot exclude single plugins; for a custom set, register the plugins individually. Import package subpaths without a file extension. Many plugins read their `process.env` configuration when they are imported, so load environment variables before importing plugins.

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
