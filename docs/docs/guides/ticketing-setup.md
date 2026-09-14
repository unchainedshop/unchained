---
sidebar_position: 10
title: Event Ticketing Setup
sidebar_label: Event Ticketing
description: Configure event ticketing with PDF tickets, Apple Wallet, and Google Wallet passes
---

# Event Ticketing Setup

`@unchainedshop/ticketing` adds order PDF downloads, Apple Wallet and Google Wallet routes, pass storage, and order access through magic keys. Your application supplies the renderers; the package does not include default SVG/PDF templates or wallet template configurators.

## Installation

```bash
npm install @unchainedshop/ticketing
```

Install the rendering libraries your application uses separately. For Apple Wallet update notifications, install the optional `@parse/node-apn` peer dependency and configure `PASS_CERTIFICATE_PATH` and `PASS_CERTIFICATE_SECRET`.

## Configure the Platform

Implement the three renderer modules imported below according to the contracts in the next section:

```typescript
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePlugins from '@unchainedshop/plugins/presets/base-fastify.js';
import setupTicketing, {
  ticketingModules,
  ticketingServices,
  type TicketingAPI,
} from '@unchainedshop/ticketing';
import connectTicketing from '@unchainedshop/ticketing/lib/fastify.js';
import renderOrderPDF from './renderers/order-pdf.js';
import createAppleWalletPass from './renderers/apple-wallet.js';
import createGoogleWalletPass from './renderers/google-wallet.js';

const app = Fastify();
const platform = await startPlatform({
  modules: { ...baseModules, ...ticketingModules },
  services: { ...ticketingServices },
});

setupTicketing(platform.unchainedAPI as TicketingAPI, {
  renderOrderPDF,
  createAppleWalletPass,
  createGoogleWalletPass,
});

await connect(app, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  initPluginMiddlewares(server) {
    connectBasePlugins(server);
    connectTicketing(server);
  },
});

await app.listen({ host: '::', port: Number(process.env.PORT || 4010) });
```

For Express, use `connect` from `@unchainedshop/api/express`, the `base-express.js` preset connector, and `@unchainedshop/ticketing/lib/express.js` for the ticketing connector. Register ticketing routes through `initPluginMiddlewares` so the Unchained request context is available.

Set the [required platform environment variables](../platform-configuration/environment-variables.md) and `UNCHAINED_SECRET` before startup. Ticketing uses that additional secret to derive magic keys.

## Renderer Contracts

| Renderer | Arguments | Result |
|----------|-----------|--------|
| `renderOrderPDF` | `{ orderId, variant? }`, Unchained context | Promise of a Node readable stream containing a PDF |
| `createAppleWalletPass` | Token surrogate, Unchained context | Pass with `serialNumber`, `passTypeIdentifier`, and `asBuffer()` returning the signed `.pkpass` bytes |
| `createGoogleWalletPass` | Token surrogate, Unchained context | Pass with `asURL()` returning the Google Wallet save link |

The callback types are available in `@unchainedshop/ticketing/lib/template-registry.js`. A renderer can query orders and products through `context.modules`. Tokens associated with an order are stored with `meta.orderId`:

```typescript
const order = await context.modules.orders.findOrder({ orderId });
const tokens = await context.modules.warehousing.findTokens({
  'meta.orderId': orderId,
});
```

Use `token.tokenSerialNumber` and your product metadata to build ticket contents. Your renderers are responsible for signing wallet passes and configuring provider credentials. Passing `undefined` to a renderer option does not install a fallback renderer.

## Magic Key Order Access

```typescript
const magicKey = await context.modules.passes.buildMagicKey(orderId);
```

Send the resulting key in the `x-magic-key` header for GraphQL order and token access. The ticketing role extension grants `viewOrder`, `viewToken`, and `updateToken` for the matching order, subject to the token's original owner still owning it.

Magic keys are deterministic hashes derived from the order ID and `UNCHAINED_SECRET`. They are reusable and do not expire automatically. Treat links containing them as credentials.

```bash
UNCHAINED_SECRET=your-random-ticketing-secret
```

## API Endpoints

| Default endpoint | Purpose | Configuration |
|------------------|---------|---------------|
| `/rest/print_tickets?orderId=...&otp=...` | Render order PDF | `UNCHAINED_PDF_PRINT_HANDLER_PATH` |
| `/rest/apple-wallet/download/:tokenId.pkpass?hash=...` | Download Apple Wallet pass | `APPLE_WALLET_WEBSERVICE_PATH` |
| `/rest/google-wallet/download/:tokenId?hash=...` | Redirect to Google Wallet | `GOOGLE_WALLET_WEBSERVICE_PATH` |

The PDF handler checks the `viewOrder` action. The Fastify handler requires string `orderId` and `otp` query parameters; supply the magic key through `x-magic-key` when using magic-key authorization. The `otp` query parameter by itself does not set that header.

Wallet download routes use a separate token access key, created from the token's current owner:

```typescript
const token = await context.modules.warehousing.findToken({ tokenId });
if (!token) throw new Error('Token not found');
const hash = await context.modules.warehousing.buildAccessKeyFromToken(token);
const appleURL = new URL(`/rest/apple-wallet/download/${tokenId}.pkpass`, process.env.ROOT_URL);
appleURL.searchParams.set('hash', hash);
const googleURL = new URL(`/rest/google-wallet/download/${tokenId}`, process.env.ROOT_URL);
googleURL.searchParams.set('hash', hash);
```

Apple Wallet device registration and pass update requests are also handled under `APPLE_WALLET_WEBSERVICE_PATH`.

## Query Order Tickets

```graphql
query OrderTickets($orderId: ID!) {
  order(orderId: $orderId) {
    _id
    orderNumber
    items {
      _id
      tokens {
        _id
        quantity
      }
    }
  }
}
```

## Run the Repository Example

From the repository root:

```bash
nvm use
npm ci
npm run build:packages
npm run dev --workspace @unchainedshop/example-ticketing
```

The example demonstrates wiring with placeholder renderers. Replace them with your implementations to generate downloadable tickets.

## Related

- [Ticketing package](https://github.com/unchainedshop/unchained/tree/master/packages/ticketing)
- [Ticketing example](https://github.com/unchainedshop/unchained/tree/master/examples/ticketing)
- [Warehousing Module](../platform-configuration/modules/warehousing.md)
- [Order Lifecycle](../concepts/order-lifecycle.md)
