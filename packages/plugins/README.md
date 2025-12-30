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
| PayPal Checkout | `payment/paypal-checkout` | PayPal Checkout integration |
| Braintree | `payment/braintree` | Braintree payments |
| Payrexx | `payment/payrexx` | Payrexx payment gateway |
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
| Product Round | `pricing/product-round` | Price rounding |
| Product Discount | `pricing/product-discount` | Product-level discounts |
| Order Items | `pricing/order-items` | Order item pricing |
| Order Delivery | `pricing/order-delivery` | Delivery pricing |
| Order Payment | `pricing/order-payment` | Payment fee pricing |
| Order Discount | `pricing/order-discount` | Order-level discounts |
| Order Round | `pricing/order-round` | Order total rounding |
| Free Delivery | `pricing/free-delivery` | Free delivery conditions |
| Free Payment | `pricing/free-payment` | Free payment processing |
| Swiss Tax (CH) | `pricing/tax/ch` | Swiss VAT calculation |

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

// Import specific plugins
import '@unchainedshop/plugins/payment/stripe';
import '@unchainedshop/plugins/delivery/post';
import '@unchainedshop/plugins/pricing/product-catalog-price';

const platform = await startPlatform({
  // ...
});
```

## Security

### Payment Plugin Security

All payment plugins implement secure tokenization patterns for PCI DSS SAQ-A eligibility:

| Plugin | Security Method |
|--------|-----------------|
| Stripe | PaymentIntent/SetupIntent tokenization |
| Datatrans | Secure Fields with HMAC-SHA-256 signatures |
| Saferpay | Redirect with SHA-256 transaction signatures |
| PayPal | Order ID references |
| Braintree | Client SDK tokenization |
| Cryptopay | BIP-32 HD wallet address derivation |

**Signature Algorithms:**
- HMAC-SHA-256: Datatrans, Payrexx, GridFS file uploads
- HMAC-SHA-512: PostFinance Checkout
- SHA-256: Saferpay

### FIPS 140-3 Compatibility

All cryptographic operations use FIPS-approved algorithms. When deployed on FIPS-enabled Node.js (e.g., Chainguard node-fips), plugins operate in FIPS-compliant mode.

See [SECURITY.md](../../SECURITY.md) for complete security documentation.

## Notes

### Postfinance Checkout Plugin

Due to a TypeScript issue with the upstream "postfinancecheckout" package, the Postfinance plugin has been disabled from transpilation. To use it:
1. Import the source TypeScript files directly from `src`
2. Enable `node_modules` TypeScript compilation, or
3. Copy `src/payment/postfinance-checkout` to your project

## License

EUPL-1.2
