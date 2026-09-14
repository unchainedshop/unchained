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
import express from 'express';
import { startPlatform } from '@unchainedshop/platform';
import setupTicketing, { ticketingModules, ticketingServices, type TicketingAPI } from '@unchainedshop/ticketing';
import { connect } from '@unchainedshop/api/express';
import mountTicketRoutes from '@unchainedshop/ticketing/lib/express.js';

const app = express();

const engine = await startPlatform({
  modules: ticketingModules,
  services: ticketingServices,
});

connect(app, engine);
mountTicketRoutes(app);

// Setup ticketing with your renderers
setupTicketing(engine.unchainedAPI as TicketingAPI, {
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
| `@unchainedshop/ticketing/lib/express.js` | Express route handlers |
| `@unchainedshop/ticketing/lib/fastify.js` | Fastify route handlers |

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
| `RendererTypes` | Renderer type union; runtime constants are in the template registry |

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

### Wallet Renderers

Supply renderers through `setupTicketing` or `setupMobileTickets`. Each receives `(token, unchainedAPI)` and returns an object with asynchronous `asURL()` and `asBuffer()` methods. Apple passes also provide `serialNumber` and `passTypeIdentifier`. Configure issuer/team identifiers and signing credentials in your renderer.

The core package does not provide `createAppleWalletPass` or `createGoogleWalletPass` implementations. See the [renderer contracts](src/template-registry.ts) and the [ticketing example](../../examples/ticketing/README.md).

## Magic Key Order Access

Allow users to access orders and tickets without logging in via a deterministic magic key:

```typescript
// Generate magic key
const magicKey = await modules.passes.buildMagicKey(orderId);

// Send via the x-magic-key HTTP header for API access
```

The key is a SHA-256 digest of the order ID and `UNCHAINED_SECRET`. It is reusable and has no built-in expiration or consumption; rotating the secret changes all generated keys.

Protected actions: `viewOrder`, `updateToken`, `viewToken`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UNCHAINED_SECRET` | Required for magic key derivation |
| `PASS_CERTIFICATE_PATH` | Path to Apple pass certificate |
| `PASS_CERTIFICATE_SECRET` | PEM passphrase |

## License

EUPL-1.2
