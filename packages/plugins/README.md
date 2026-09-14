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
| Invoice | `payment/invoice.js` | Simple invoice-based payment |
| Invoice Prepaid | `payment/invoice-prepaid.js` | Prepaid invoice payment |
| Stripe | `payment/stripe/index.js` | Stripe payment integration |
| Datatrans V2 | `payment/datatrans-v2/index.js` | Datatrans payment gateway |
| Saferpay | `payment/saferpay/index.js` | Saferpay payment gateway |
| PayPal Checkout | `payment/paypal-checkout.js` | PayPal Checkout integration |
| Braintree | `payment/braintree.js` | Braintree payments |
| Payrexx | `payment/payrexx/index.js` | Payrexx payment gateway |
| Apple IAP | `payment/apple-iap/index.js` | Apple In-App Purchase |
| Cryptopay | `payment/cryptopay/index.js` | Cryptocurrency payments |

### Delivery Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Post | `delivery/post.js` | Standard postal delivery |
| Stores | `delivery/stores.js` | Store pickup delivery |
| Send Message | `delivery/send-message.js` | Digital delivery via messaging |

### Pricing Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Product Catalog Price | `pricing/product-catalog-price.js` | Base catalog pricing |
| Product Price Rate Conversion | `pricing/product-price-rateconversion.js` | Currency conversion |
| Product Round | `pricing/product-round.js` | Price rounding |
| Product Discount | `pricing/product-discount.js` | Product-level discounts |
| Order Items | `pricing/order-items.js` | Order item pricing |
| Order Delivery | `pricing/order-delivery.js` | Delivery pricing |
| Order Payment | `pricing/order-payment.js` | Payment fee pricing |
| Order Discount | `pricing/order-discount.js` | Order-level discounts |
| Order Round | `pricing/order-round.js` | Order total rounding |
| Free Delivery | `pricing/free-delivery.js` | Free delivery conditions |
| Free Payment | `pricing/free-payment.js` | Free payment processing |
| Swiss Product Tax | `pricing/product-swiss-tax.js` | Swiss VAT on products |
| Swiss Delivery Tax | `pricing/delivery-swiss-tax.js` | Swiss VAT on delivery |

### Filter Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Strict Equal | `filters/strict-equal.js` | Exact match filtering |
| Local Search | `filters/local-search.js` | Full-text search |

### File Storage Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| GridFS | `files/gridfs/index.js` | MongoDB GridFS storage |
| MinIO | `files/minio/index.js` | MinIO/S3-compatible storage |

### Worker Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Email | `worker/email.js` | Email sending worker |
| Heartbeat | `worker/heartbeat.js` | Keep-alive heartbeat |
| HTTP Request | `worker/http-request.js` | HTTP request worker |
| Bulk Import | `worker/bulk-import.js` | Bulk data import |
| External | `worker/external.js` | External service calls |
| Twilio | `worker/twilio.js` | Twilio SMS integration |
| Push Notification | `worker/push-notification.js` | Push notifications |
| Update ECB Rates | `worker/update-ecb-rates.js` | ECB exchange rates |
| Update Coinbase Rates | `worker/update-coinbase-rates.js` | Crypto exchange rates |
| Update Token Ownership | `worker/update-token-ownership.js` | NFT ownership sync |
| Zombie Killer | `worker/zombie-killer.js` | Remove carts whose owners no longer exist |
| Error Notifications | `worker/error-notifications.js` | Error alerting |

### Event Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Node Event Emitter | `events/node-event-emitter.js` | Default Node.js emitter |
| Redis | `events/redis.js` | Redis pub/sub |
| AWS EventBridge | `events/aws-eventbridge.js` | AWS EventBridge |

### Warehousing Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Store | `warehousing/store.js` | Basic inventory |
| ETH Minter | `warehousing/eth-minter.js` | Ethereum NFT minting |

### Other Adapters

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| Licensed Enrollment | `enrollments/licensed.js` | License-based subscriptions |
| Manual Quotation | `quotations/manual.js` | Manual quote handling |

## Usage

Import and register plugins during platform initialization:

```typescript
import { startPlatform } from '@unchainedshop/platform';

// Import specific plugins
import '@unchainedshop/plugins/payment/stripe/index.js';
import '@unchainedshop/plugins/delivery/post.js';
import '@unchainedshop/plugins/pricing/product-catalog-price.js';

const platform = await startPlatform({
  // ...
});
```

## Security

Payment integrations use different mechanisms: Stripe uses PaymentIntent/SetupIntent references, PayPal uses order references, and Cryptopay derives wallet addresses. Payment compliance and cryptography requirements depend on the plugins and deployment; see [SECURITY.md](../../SECURITY.md).

Install the optional peer dependencies needed by your selected plugins. Import paths include `.js` (and `/index.js` for directory entry points) because the package exports compiled files directly.

## PostFinance Checkout

The PostFinance Checkout plugin is included in compilation and uses the bundled API client. Import it with:

```typescript
import '@unchainedshop/plugins/payment/postfinance-checkout/index.js';
```

## License

EUPL-1.2
