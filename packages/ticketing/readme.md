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
import setupTicketing, { ticketingModules, ticketingServices } from '@unchainedshop/ticketing';
import { connect } from '@unchainedshop/api/express';

const app = express();

const engine = await startPlatform({
  modules: ticketingModules,
  services: ticketingServices,
});

connect(app, engine, { corsOrigins: [] });

// Setup ticketing with your renderers
setupTicketing(engine.unchainedAPI, {
  renderOrderPDF,
  createAppleWalletPass,
  createGoogleWalletPass,
});
```

## API Overview

### Setup Functions

| Export | Description |
|--------|-------------|
| `setupTicketing` | Initialize ticketing with all renderers |
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
| `@unchainedshop/ticketing/express` | Express route handlers |
| `@unchainedshop/ticketing/fastify` | Fastify route handlers |

### Renderer Types

| Type | Description |
|------|-------------|
| `ORDER_PDF` | PDF ticket/receipt rendering |
| `APPLE_WALLET` | Apple Wallet pass generation |
| `GOOGLE_WALLET` | Google Wallet pass generation |

### Types

| Export | Description |
|--------|-------------|
| `TicketingAPI` | Ticketing API context type |
| `TicketingModule` | Module interface type |
| `TicketingServices` | Services interface type |
| `RendererTypes` | Renderer type constants |

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

Allow users to access orders and tickets without logging in via a one-time magic key:

```typescript
// Generate magic key
const magicKey = await modules.passes.buildMagicKey(orderId);

// Use in URL: https://my-shop/:orderId?otp=:magicKey
// Send via x-magic-key HTTP header for API access
```

Protected actions: `viewOrder`, `updateToken`, `viewToken`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UNCHAINED_SECRET` | Required for magic key encryption |
| `PASS_CERTIFICATE_PATH` | Path to Apple pass certificate |
| `PASS_CERTIFICATE_SECRET` | PEM passphrase |
| `PASS_TEAM_ID` | Apple Developer Team ID |

## License

EUPL-1.2
