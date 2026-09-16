[![npm version](https://img.shields.io/npm/v/@unchainedshop/ticketing.svg)](https://npmjs.com/package/@unchainedshop/ticketing)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/ticketing

Event ticketing extension for the Unchained Engine. Provides PDF ticket generation, Apple Wallet passes, Google Wallet passes, and magic key order access.

## Installation

```bash
npm install @unchainedshop/ticketing
```

## Usage

```typescript
import { startPlatform } from '@unchainedshop/platform';
import express from 'express';
import setupTicketing, {
  ticketingModules,
  ticketingServices,
  ticketingTypeDefs,
  ticketingResolvers,
  ticketingActions,
  configureTicketingRoles,
  type TicketingAPI,
} from '@unchainedshop/ticketing';
import { ticketingAdminPlugin } from '@unchainedshop/ticketing/admin-plugin';
import connectTicketing from '@unchainedshop/ticketing/lib/express.js';
import { connect } from '@unchainedshop/api/express';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';

registerBasePlugins();
const app = express();

const engine = await startPlatform({
  modules: ticketingModules,
  services: ticketingServices,
  typeDefs: ticketingTypeDefs,
  resolvers: [ticketingResolvers],
  rolesOptions: {
    additionalActions: ticketingActions,
    additionalRoles: { ticketing: configureTicketingRoles },
  },
});

await connect(app, engine, {
  adminUI: { plugins: [ticketingAdminPlugin()] },
});
connectTicketing(app);

// Setup ticketing with your renderers
setupTicketing(engine.unchainedAPI as TicketingAPI, {
  renderOrderPDF,
  createAppleWalletPass,
  createGoogleWalletPass,
});

app.listen(4010);
```

Define the three renderer callbacks before running this example, and configure `UNCHAINED_SECRET` plus the platform's required environment variables. Renderers and their third-party dependencies belong to your application; see the [ticketing example](../../examples/ticketing/boot.ts).

### Admin UI and gate permissions

The plugin groups event management and gate control under **Ticketing**. Product managers see
**Events**; signed-in users with the `scanTicket` action see **Gate Control**. Assign the `ticketing`
role registered above to gate operators, or grant `scanTicket` in a custom role. Administrators
have access automatically. Gate operators can read active events and their attendees, and redeem
eligible tickets through the `scanTicket` mutation. This grants no token export, cancellation, or
reimbursement rights. Individual cancellations require `cancelTicket`; event cancellation requires
`manageProducts`.

Gate access uses the regular account session. Pass codes, gate cookies, and separate gate login
mutations are not supported. All ticket queries, mutations, and cancellation fields are defined by
this extension, and the Admin UI plugin only appears when registered. See the
[example configuration](../../examples/ticketing/README.md#gate-access-and-reimbursements) for
reimbursement signing and checkout setup.

## API Overview

### Setup Functions

| Export | Description |
|--------|-------------|
| default export (`setupTicketing`) | Initialize ticketing with all renderers |
| `setupPDFTickets` | Setup only PDF rendering |
| `setupMobileTickets` | Setup only wallet passes |

### Modules

| Export | Description |
|--------|-------------|
| `ticketingModules` | Additional modules for ticketing |
| `ticketingServices` | Additional services for ticketing |

### Server Adapters

| Import Path | Description |
|-------------|-------------|
| `@unchainedshop/ticketing/lib/express.js` | Express route connector (default export) |
| `@unchainedshop/ticketing/lib/fastify.js` | Fastify route connector (default export) |

### Renderer Types

| Type | Description |
|------|-------------|
| `order` | PDF ticket/receipt rendering |
| `apple-wallet` | Apple Wallet pass generation |
| `google-wallet` | Google Wallet pass generation |

### Types

| Export | Description |
|--------|-------------|
| `TicketingAPI` | Ticketing API context type |
| `TicketingModule` | Module interface type |
| `TicketingServices` | Services interface type |
| `RendererTypes` | Union of renderer type values |

## Apple Wallet Setup

1. Add a new Pass Type ID on [developer.apple.com](https://developer.apple.com/account), then generate a production certificate. Download and import into Keychain.

2. Export with Keychain: Select "Certificates" tab, select the Pass Type ID, select both ID and key, export in p12 format.

3. Convert to PEM (set a PEM passphrase as required):
```bash
openssl pkcs12 -in Certificates.p12 -legacy -clcerts -out cert_and_key.pem
```

4. Configure via environment variables:
```bash
PASS_CERTIFICATE_PATH=./cert_and_key.pem
PASS_CERTIFICATE_SECRET=YOUR_PEM_PASSPHRASE
PASS_TEAM_ID=SSCB95CV6U
```

## Renderer Implementation

### PDF Renderer

```tsx
import React from 'react';
import ReactPDF, { Document } from '@react-pdf/renderer';

const TicketTemplate = ({ tickets }) => (
  <Document>
    {/* Your ticket layout */}
  </Document>
);

export default async ({ orderId, variant }, { modules }) => {
  const order = await modules.orders.findOrder({ orderId });
  // ... prepare data
  return ReactPDF.renderToStream(<TicketTemplate tickets={tickets} />);
};
```

### Apple Wallet Renderer

```typescript
import { Template, constants } from '@walletpass/pass-js';

export default async (token, unchainedAPI) => {
  const template = new Template('eventTicket', /* ... */);
  const pass = await template.createPass(/* ... */);
  return pass;
};
```

### Google Wallet Renderer

```typescript
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

export default async (token, unchainedAPI) => {
  // Upsert class and object
  const asURL = async () => createJwtNewObjects(issuerId, productId, token.tokenSerialNumber);
  return { asURL };
};
```

## Magic Key Order Access

Allow users to access orders and tickets without logging in via an order-specific magic key:

```typescript
// Generate magic key
const magicKey = await modules.passes.buildMagicKey(orderId);

// Use in URL: https://my-shop/:orderId?otp=:magicKey
// Send via x-magic-key HTTP header for API access
```

Protected actions: `viewOrder`, `updateToken`, `viewToken`

The key is a deterministic SHA-256 digest of the order ID and `UNCHAINED_SECRET`. It is reusable and has no built-in expiration; changing the secret changes every order's key.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UNCHAINED_SECRET` | Required for magic key derivation |
| `PASS_CERTIFICATE_PATH` | Path to Apple pass certificate used by the example renderer |
| `PASS_CERTIFICATE_SECRET` | PEM passphrase used by the example renderer |
| `PASS_TEAM_ID` | Apple Developer Team ID used by the example renderer |

## License

EUPL-1.2
