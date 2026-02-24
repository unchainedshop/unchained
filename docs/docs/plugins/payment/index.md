---
sidebar_position: 1
title: Payment Plugins
sidebar_label: Payment
description: Payment provider plugins for Unchained Engine
---

# Payment Plugins

Payment plugins integrate various payment service providers with Unchained Engine.

| Adapter Key | Description | Integration Type | Subscriptions | Best For |
|-------------|-------------|-----------------|---------------|----------|
| [`shop.unchained.payment.stripe`](./stripe.md) | Stripe Payments | Server-side | Yes | Global card payments, most use cases |
| [`shop.unchained.datatrans`](./datatrans.md) | Swiss payment service provider | Hosted checkout | No | Swiss merchants needing local methods |
| [`shop.unchained.payment.saferpay`](./saferpay.md) | Worldline Saferpay | Hosted checkout | No | European merchants (Worldline ecosystem) |
| [`shop.unchained.payment.postfinance-checkout`](./postfinance-checkout.md) | PostFinance Checkout | Hosted checkout | No | PostFinance customers |
| [`shop.unchained.payment.payrexx`](./payrexx.md) | Swiss PSP (TWINT, PostFinance) | Hosted checkout | No | TWINT and Swiss payment methods |
| [`shop.unchained.braintree-direct`](./braintree.md) | PayPal-owned payment processor | Server-side | No | PayPal integration |
| [`shop.unchained.payment.cryptopay`](./cryptopay.md) | Self-hosted crypto payments | Server-side | No | Cryptocurrency payments |
| [`shop.unchained.apple-iap`](./apple-iap.md) | Apple In-App Purchase for iOS apps | Native SDK | Yes | iOS in-app purchases |
| [`shop.unchained.invoice`](./invoice.md) | Pay-per-invoice (B2B) | Offline | No | B2B invoicing |
| [`shop.unchained.invoice-prepaid`](./invoice-prepaid.md) | Prepayment invoice | Offline | No | Prepayment / proforma invoices |

## Creating Custom Payment Plugins

See [Custom Payment Plugins](../../extend/order-fulfilment/fulfilment-plugins/payment.md) for creating your own payment adapters.
