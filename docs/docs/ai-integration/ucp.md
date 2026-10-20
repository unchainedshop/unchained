---
title: Universal Commerce Protocol (UCP)
description: Let AI shopping agents check out on your Unchained shop through the Universal Commerce Protocol 2026-08-25.
sidebar_label: UCP Checkout
sidebar_position: 3.5
---

# Universal Commerce Protocol (UCP)

The UCP plugin lets AI shopping agents ("platforms") run checkouts on your shop through the [Universal Commerce Protocol](https://ucp.dev) version `2026-08-25`. It serves the business profile at `/.well-known/ucp` and the REST checkout capability with the fulfillment, discount and order extensions. Each checkout session is a cart of its own guest user, so storefront features such as pricing, Swiss VAT, discounts, delivery providers and order e-mails apply unchanged.

## Setup

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { createUcpPlugin } from '@unchainedshop/plugins/agentic/ucp';

pluginRegistry.register(
  createUcpPlugin({
    platforms: [{ profile: 'https://agent.example/.well-known/ucp', username: 'agent-example' }],
    links: [{ type: 'terms_of_service', url: 'https://shop.example/terms' }],
  }),
);
```

| Option | Default | Description |
| --- | --- | --- |
| `platforms` | `[]` | Registered platforms: `profile` URL, `username` of the API user it authenticates as, `requireSignature` |
| `anonymous` | `true` | Serve platforms that are not registered |
| `paymentHandlers` | `[invoiceHandler]` | Payment handlers agents can pay with in-band |
| `checkoutUrl` | `${EMAIL_WEBSITE_URL}/checkout` | Storefront checkout the `continue_url` hands off to |
| `orderUrl` | `${EMAIL_WEBSITE_URL}/order?_id=…` | `permalink_url` of placed orders |
| `links` | `[]` | Legal links of every checkout |
| `basePath` | `/ucp` | Prefix of the REST endpoints |

| Environment variable | Description |
| --- | --- |
| `ROOT_URL` | Public URL of the engine, used for the service endpoint and `continue_url` |
| `UCP_SIGNING_KEY` | P-256 private key (PKCS #8 PEM) that signs order webhooks, published in `keys[]` |
| `UCP_SIGNING_KEY_ID` | Optional `kid`, defaults to the RFC 7638 thumbprint |
| `UCP_DEV_INSECURE_HOSTS` | Comma-separated hosts whose profiles may be fetched over HTTP or loopback, ignored in production |

## Platforms

Any agent can run checkouts. Its `UCP-Agent` profile is fetched over HTTPS only, without redirects and never from special-use IP addresses, and decides which capabilities are active. Registered platforms additionally get order webhooks (to the `webhook_url` of their profile's order capability) and Get Order. A registered platform with a `username` has to send that API user's token (`Authorization: Bearer …`); `requireSignature` makes RFC 9421 signatures mandatory, which are verified against the profile's `keys[]` whenever a request carries one.

## Payment

Agents pay in-band only with a payment handler the platform declares in its profile. The built-in `shop.unchained.payment.invoice` handler covers the `shop.unchained.invoice` (pay later, the order is confirmed) and `shop.unchained.invoice-prepaid` (the order stays pending until paid) adapters, so an agent can buy without card data and without 3-D Secure.

Without a usable handler, a checkout answers `requires_escalation` with a `continue_url`. The URL logs the buyer in as the checkout's guest user and redirects to your storefront checkout, where your payment provider (Saferpay, Datatrans, PostFinance, Stripe, TWINT …) runs its own 3-D Secure. The platform then sees `completed` on its next Get Checkout. The engine's auth cookie has to reach the storefront, so engine and storefront need to be on the same site (e.g. `api.shop.ch` and `shop.ch`).

A payment adapter that needs buyer authentication throws an error with `cause: 'PAYMENT_REQUIRES_ACTION'`; the checkout stays unnumbered and answers a recoverable `payment_failed` with its `continue_url`.

## Privacy

Idempotency records keep the responses of the last 48 hours, including buyer data. Order webhooks send order data to the platform, which can be a disclosure abroad under the nFADP: name the platforms you register in your privacy notice.
