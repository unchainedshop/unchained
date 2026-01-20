---
sidebar_position: 1
title: Payment Plugins
sidebar_label: Payment
description: Payment provider plugins for Unchained Engine
---

# Payment Plugins

Payment plugins integrate various payment service providers with Unchained Engine.

| Adapter Key | Description |
|-------------|-------------|
| [`shop.unchained.apple-iap`](./apple-iap.md) | Apple In-App Purchase for iOS apps |
| [`shop.unchained.braintree-direct`](./braintree.md) | PayPal-owned payment processor |
| [`shop.unchained.payment.cryptopay`](./cryptopay.md) | Self-hosted crypto payments |
| [`shop.unchained.datatrans`](./datatrans.md) | Swiss payment service provider |
| [`shop.unchained.invoice`](./invoice.md) | Pay-per-invoice (B2B) |
| [`shop.unchained.invoice-prepaid`](./invoice-prepaid.md) | Prepayment invoice |
| [`shop.unchained.payment.payrexx`](./payrexx.md) | Swiss PSP (TWINT, PostFinance) |
| [`shop.unchained.payment.postfinance-checkout`](./postfinance-checkout.md) | PostFinance Checkout |
| [`shop.unchained.payment.saferpay`](./saferpay.md) | Worldline Saferpay |
| [`shop.unchained.payment.stripe`](./stripe.md) | Stripe Payments |

## Creating Custom Payment Plugins

See [Custom Payment Plugins](../../extend/order-fulfilment/fulfilment-plugins/payment.md) for creating your own payment adapters.
