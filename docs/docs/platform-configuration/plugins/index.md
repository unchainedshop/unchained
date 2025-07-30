---
sidebar_position: 1
title: Overview
sidebar_title: Overview
---

The (growing) list of available Unchained Engine plugins

## Plugin Presets

Unchained provides several pre-configured plugin bundles for quick setup:

- **[Base Preset](./presets#base-preset)** - Essential plugins for minimal e-commerce setup
- **[All Preset](./presets#all-preset)** - Full-featured setup with all payment providers and features  
- **[Crypto Preset](./presets#crypto-preset)** - Specialized for cryptocurrency and blockchain functionality
- **[Country-Specific Presets](./presets#country-specific-presets)** - Localized plugins (Switzerland, etc.)

👉 **[View complete preset documentation](./presets)**

## Individual Plugins

## Payment Providers

| Plugin                                 | Description                                                                                                             | Link to provider                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Apple In-App Purchase                  | Apple In-App Purchase integration for iOS apps                                                                         | https://developer.apple.com/in-app-purchase/ |
| Braintree                              | Global payments provider owned by PayPal providing a variety of payment methods                                         | https://www.braintreepayments.com/           |
| [Cryptopay](./cryptopay)               | Self-hosted, decentralized (Chainlink price feeds) crypto payments in arbitrary cryptocurrencies (BTC, ETH, ERC20, ...) |                                              |
| [Datatrans](./datatrans)               | Swiss-based payment provider with a huge integration support of over 40 payment methods                                 | https://www.datatrans.ch/en/                 |
| Invoice Prepaid                        | Pay-per-invoice provider using the pre-payment method which releases the order on confirmed payment only                |                                              |
| Invoice                                | Pay-per-invoice provider with payment being invoiced independently of order confirmation                                |                                              |
| PayPal Checkout                        | PayPal integration with checkout SDK                                                                                    | https://www.paypal.com/                      |
| PayRexx                                | Swiss payment provider with various payment methods                                                                     | https://www.payrexx.com/                     |
| [PostFinance Checkout](./postfinanc-checkout) | PostFinance checkout integration (Switzerland)                                                                 | https://checkout.postfinance.ch/             |
| [Saferpay](./saferpay)                 | Worldline Saferpay payment integration                                                                                 | https://www.saferpay.com/                    |
| Stripe                                 | Stripe checkout integration                                                                                             | https://stripe.com/                          |

## Delivery Providers

| Plugin                                 | Description                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Pick-Mup                               | Delivery via Pick-Mup service                                                                                          |
| Post                                   | Generic postal delivery                                                                                                |
| Send Message                           | Message-based delivery notifications                                                                                    |
| Store Pickup                           | In-store pickup delivery option                                                                                        |

## Warehousing

| Plugin                                 | Description                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Store                                  | Basic store inventory management                                                                                        |
| ETH Minter                             | Ethereum token minting for digital assets                                                                              |

## Pricing

| Plugin                                 | Description                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Free Payment                           | Free payment pricing (no charges)                                                                                      |
| Free Delivery                          | Free delivery pricing                                                                                                   |
| Order Items                            | Basic order item pricing                                                                                               |
| Order Discount                         | Order-level discount calculations                                                                                       |
| Order Delivery                         | Delivery pricing for orders                                                                                            |
| Order Payment                          | Payment fee calculations                                                                                               |
| Product Catalog Price                  | Standard product catalog pricing                                                                                        |
| Product Discount                       | Product-level discount calculations                                                                                     |
| Product Price Rate Conversion          | Currency conversion for product prices                                                                                  |
| Swiss Tax                              | Swiss taxation calculations for products and delivery                                                                   |

## Worker Plugins

| Plugin                                 | Description                                                                                                             | Link to provider                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Bulk Import                            | Migrate and/or import data from any source                                                                             |                                              |
| BudgetSMS                              | SMS messaging via BudgetSMS                                                                                            | https://www.budgetsms.net/                   |
| Bulkgate                               | SMS messaging via Bulkgate                                                                                             | https://www.bulkgate.com/                    |
| Email                                  | Email notifications via Nodemailer                                                                                     | https://nodemailer.com/                      |
| Enrollment Order Generator             | Automatic order generation for enrollments                                                                             |                                              |
| Error Notifications                    | System error notification handling                                                                                      |                                              |
| Export Token                           | Token export functionality                                                                                             |                                              |
| External                               | External service integration                                                                                           |                                              |
| Heartbeat                              | System health monitoring                                                                                               |                                              |
| HTTP Request                           | Generic HTTP request handling                                                                                          |                                              |
| Message                                | Generic message handling                                                                                               |                                              |
| [Push Notification](./push-notification) | Web push notification messaging                                                                                     | https://web.dev/notifications/               |
| [SMS (Twilio)](./twilio)               | SMS messaging via Twilio                                                                                              | https://www.twilio.com/                      |
| Update Coinbase Rates                  | Automatic currency rate updates from Coinbase                                                                          | https://www.coinbase.com/                    |
| Update ECB Rates                       | Automatic currency rate updates from ECB                                                                               | https://www.ecb.europa.eu/                   |
| Update Token Ownership                 | Blockchain token ownership tracking                                                                                     |                                              |
| Zombie Killer                          | Cleanup of stale processes and data                                                                                     |                                              |

## File Storage

| Plugin                                 | Description                                                                                                             | Link to provider                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| GridFS                                 | MongoDB GridFS file storage                                                                                            | https://docs.mongodb.com/manual/core/gridfs/ |
| Minio                                  | S3-compatible object storage                                                                                            | https://min.io/                             |

## Search & Filtering

| Plugin                                 | Description                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Local Search                           | Local text-based search functionality                                                                                  |
| Strict Equal                           | Exact match filtering                                                                                                   |

## Event Systems

| Plugin                                 | Description                                                                                                             | Link to provider                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| AWS EventBridge                        | AWS EventBridge integration for event-driven architecture                                                              | https://aws.amazon.com/eventbridge/          |
| Node Event Emitter                     | Node.js native event emitter for inter-module communication                                                            | https://nodejs.org/api/events.html          |
| Redis                                  | Redis-based event publishing/subscribing                                                                               | https://redis.io/                           |

## Enrollments

| Plugin                                 | Description                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Licensed                               | Licensed product enrollment handling                                                                                    |

## Quotations

| Plugin                                 | Description                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Manual                                 | Manual quotation generation                                                                                             |