---
sidebar_position: 1
title: Overview
sidebar_title: Overview
---


The (growing) list of available Unchained Engine plugins

| Plugin                                 | Description                                                                                                             | Link to provider                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Payment Provider**                   |                                                                                                                         |                                              |
| <u>Apple Pay</u>                       | Apple Pay integration                                                                                                   | https://www.apple.com/apple-pay/             |
| <u>Braintree</u>                       | Global Payments provider owned by PayPal providing a variety of payment methods                                         | https://www.braintreepayments.com/ch         |
| <u>Coinbase</u>                        | Crypto payments over Coinbase commerce API                                                                              | https://commerce.coinbase.com/docs/#node-js  |
| [Datatrans](/plugins/cryptopay)               | Swiss-based payment provider with a huge integration support of over 40 payment methods                                 | https://www.datatrans.ch/en/                 |
| <u>Invoice Prepaid</u>                 | Pay-per-invoice provider using the pre-payment method which releases the order on confirmed payment only                |                                              |
| <u>Invoice</u>                         | Pay-per-invoice provider with payment being invoiced independently of order confirmation                                |                                              |
| <u>PayPal</u>                          | PayPal integration                                                                                                      | https://www.paypal.com/ch/home               |
| <u>PostFinance</u>                     | Payment with PostCard (Switzerland only)                                                                                | https://www.postfinance.ch/en/private.html   |
| <u>Stripe</u>                          | Stripe check-out                                                                                                        | https://stripe.com/en-ch                     |
| [Cryptopay](./cryptopay)               | Self-hosted, decentralized (Chainlink price feeds) crypto payments in arbitrary cryptocurrencies (BTC, ETH, ERC20, ...) |                                              |
| <u>[Web-push notification](./push-notification)</u>                 | Push notification messaging  |                 https://web.dev/notifications/                             |
| <u>[SMS](/plugins/twilio)</u>                     |  Twillo                       | https://www.twilio.com/en-us/messaging/channels/sms   |
| <u>[Email](/advanced/messaging)</u>                     |  Node Mailer                       | https://nodemailer.com/about/   |
| <u>Bulk-Importer</u>                     |  Migrate and/or import data from any source     |    |
|<u> S3 compatible object storage </u> | Minio |  https://min.io/  |
|<u> Event driven communication between modules </u>| All actions emmit a corresponding event where any interested modules in the engine can subscribe too | https://nodejs.org/api/events.html  |