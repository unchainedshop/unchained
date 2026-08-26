---
sidebar_position: 10
title: Event Ticketing Setup
sidebar_label: Event Ticketing
description: Configure event ticketing with PDF tickets, Apple Wallet, and Google Wallet passes
---

# Event Ticketing Setup

The `@unchainedshop/ticketing` extension adds PDF ticket printing, Apple Wallet and Google Wallet passes, and magic-key order access on top of tokenized products (tokens are managed by the [warehousing module](../platform-configuration/modules/warehousing)).

The package provides the plumbing — DB module, REST routes, magic-key permissions, pass invalidation. *You* provide the renderers: three functions that produce the PDF, the Apple Wallet pass, and the Google Wallet link, using whatever libraries you prefer.

## Installation

```bash
npm install @unchainedshop/ticketing
# Optional: enables Apple Wallet pass update push notifications
npm install @parse/node-apn
```

`UNCHAINED_SECRET` must be set — `setupTicketing` throws without it (it derives magic keys from it).

## Setup (Fastify)

Mirrors [`examples/ticketing/boot.ts`](https://github.com/unchainedshop/unchained/tree/master/examples/ticketing):

```typescript
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import setupTicketing, { ticketingModules, type TicketingAPI } from '@unchainedshop/ticketing';
import connectTicketingToFastify from '@unchainedshop/ticketing/lib/fastify.js';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

registerBasePlugins();

const platform = await startPlatform({
  modules: ticketingModules,
  services: { ...ticketingServices },
});

setupTicketing(platform.unchainedAPI as TicketingAPI, {
  renderOrderPDF,          // your renderers, see below
  createAppleWalletPass,
  createGoogleWalletPass,
});

connect(fastify, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
});

// Register ticketing REST routes (not yet migrated to the plugin registry)
connectTicketingToFastify(fastify);

await fastify.listen({ host: '::', port: 3000 });
```

For Express, use `connectTicketingToExpress` from `@unchainedshop/ticketing/lib/express.js` instead — same sequence, called with your Express `app` after `connect(app, platform, ...)`.

Besides wiring the renderers, `setupTicketing` registers the magic-key permission rules and subscribes to token events (`TOKEN_INVALIDATED`, finished `EXPORT_TOKEN` / `UPDATE_TOKEN_OWNERSHIP` work items) to re-render affected Apple Wallet passes automatically.

## Renderers

Each renderer is a function you implement; the package calls it on demand:

| Renderer | Signature | Returns |
|----------|-----------|---------|
| `renderOrderPDF` | `({ orderId, variant }, context)` | Node.js `Readable` stream of the PDF |
| `createAppleWalletPass` | `(token, unchainedAPI)` | Pass object with `serialNumber` and `asBuffer(): Promise<Buffer>` |
| `createGoogleWalletPass` | `(token, unchainedAPI)` | "Add to Google Wallet" save link (string) |

`token` is the warehousing token (`_id`, `tokenSerialNumber`, `meta`, ...). The Apple pass binary is stored via the configured file adapter and re-generated when tokens change.

Typical libraries: `@react-pdf/renderer` or `pdfkit` for PDFs, [`@walletpass/pass-js`](https://github.com/walletpass/pass-js) for Apple Wallet (its `Template.createPass()` result satisfies the `serialNumber`/`asBuffer` contract), `googleapis` + a signed JWT for [Google Wallet](https://developers.google.com/wallet) save links. Follow the vendor docs for certificates, issuer accounts, and pass content.

## REST Endpoints

`connectTicketingToFastify`/`connectTicketingToExpress` mount these routes:

| Endpoint | Params | Description |
|----------|--------|-------------|
| `GET /rest/print_tickets` | `orderId`, `otp` (magic key), optional `variant` | Streams the PDF for an order (`403` on bad key) |
| `GET /rest/google-wallet/download/:tokenId` | `hash` (token access key) | Returns `{ "passLink": "..." }` |
| `GET /rest/apple-wallet/download/:tokenId.pkpass` | `hash` (token access key) | Downloads the `.pkpass` binary |
| `ALL /rest/apple-wallet/*` | per Apple spec | Apple Wallet web service: device registration/unregistration, pass update polling, log |

Base paths are overridable via `UNCHAINED_PDF_PRINT_HANDLER_PATH`, `GOOGLE_WALLET_WEBSERVICE_PATH`, and `APPLE_WALLET_WEBSERVICE_PATH`.

The `hash` parameter is the token's access key — query it as `token.accessKey` via GraphQL (it also works as the `x-token-accesskey` header for anonymous token access).

For Apple Wallet pass *update* push notifications, install `@parse/node-apn` and set `PASS_CERTIFICATE_PATH` (PEM with certificate + key) and `PASS_CERTIFICATE_SECRET` (passphrase).

## Magic Key Order Access

Magic keys let users access their orders and tickets without logging in — ideal for confirmation-email links.

```typescript
// In your order confirmation handler
const magicKey = await modules.passes.buildMagicKey(orderId);

// Include in the confirmation email
const ticketUrl = `https://my-shop.com/orders/${orderId}?otp=${magicKey}`;
```

Clients pass it as a header on GraphQL requests:

```http
POST /graphql
x-magic-key: YOUR_MAGIC_KEY
```

A valid magic key grants `viewOrder`, `viewToken`, and `updateToken` for the matching order. Keys are derived from `UNCHAINED_SECRET` — rotating the secret invalidates all previously sent links.

## Querying Tickets

Tokens hang off order items:

```graphql
query OrderTickets($orderId: ID!) {
  order(orderId: $orderId) {
    _id
    orderNumber
    items {
      _id
      tokens {
        _id
        tokenSerialNumber
        accessKey
        status
      }
    }
  }
}
```

Use `tokenSerialNumber`/`_id` plus `accessKey` to build the wallet download URLs above.

## Example

The [ticketing example](https://github.com/unchainedshop/unchained/tree/master/examples/ticketing) contains a complete boot file with seed data and integration tests for the REST endpoints:

```bash
git clone https://github.com/unchainedshop/unchained.git
cd unchained/examples/ticketing
npm install
npm run dev
```

## Related

- [Ticketing Package Source](https://github.com/unchainedshop/unchained/tree/master/packages/ticketing)
- [Warehousing Module](../platform-configuration/modules/warehousing) - Token management
- [Order Lifecycle](../concepts/order-lifecycle) - Order processing
- [Worker](../extend/worker) - Background job processing
