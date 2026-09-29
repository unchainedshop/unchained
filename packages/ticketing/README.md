[![npm version](https://img.shields.io/npm/v/@unchainedshop/ticketing.svg)](https://npmjs.com/package/@unchainedshop/ticketing)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/ticketing

Event ticketing for the Unchained Engine: a ticket issuer for tokenized products, sale rules and supply checks, gate control with a QR scanner, event and ticket cancellation with e-mails and optional reimbursement codes, magic-key order links, and routes that serve your tickets PDF and your Apple Wallet and Google Wallet passes.

Guides: [Event Ticketing](https://docs.unchained.shop/guides/ticketing-setup) and [Ticket Renderers](https://docs.unchained.shop/guides/ticketing-renderers).

## Installation

```bash
npm install @unchainedshop/ticketing
# Optional: pushes updated Apple Wallet passes to the devices that saved them
npm install @parse/node-apn
```

`UNCHAINED_SECRET` must be set: it derives the magic keys of orders.

## Usage

```typescript
import express from 'express';
import { pluginRegistry } from '@unchainedshop/core';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import {
  createTicketingPlugin,
  validateTicketOrderPosition,
  withTicketing,
} from '@unchainedshop/ticketing';
import { TicketWarehousingPlugin } from '@unchainedshop/ticketing/warehousing/ticket';
import { ticketingAdminPlugin } from '@unchainedshop/ticketing/admin-plugin';

registerBasePlugins();
pluginRegistry.register(
  createTicketingPlugin({
    // Your renderers (optional); their routes answer 404 until you provide them
    renderOrderPDF,
    createAppleWalletPass,
    createGoogleWalletPass,
  }),
);
pluginRegistry.register(TicketWarehousingPlugin);

const platform = await startPlatform(
  withTicketing({
    options: { orders: { validateOrderPosition: validateTicketOrderPosition } },
  }),
);

const app = express();
// Mounts the ticketing routes together with the other plugin routes, before the Admin UI
await connect(app, platform, { adminUI: { plugins: [ticketingAdminPlugin()] } });
app.listen(4010);
```

Then create one `VIRTUAL` warehousing provider with the adapter key `shop.unchained.warehousing.ticket` (the ticket issuer) and give gate staff accounts the `ticketing` role. The [ticketing example](../../examples/ticketing) does both in its seed.

## Exports

### `@unchainedshop/ticketing`

| Export | Description |
| ------ | ----------- |
| `createTicketingPlugin(options)` | The plugin: `passes` module, PDF and wallet routes, magic-key rules, cancellation e-mail templates, Apple pass refresh. Options: `renderOrderPDF`, `createAppleWalletPass`, `createGoogleWalletPass`, `discountCode` |
| `withTicketing(platformOptions, { canAccessEvent })` | Adds the GraphQL schema, services, actions and the `ticketing` role to `startPlatform` options; `canAccessEvent` limits non-admins to their events |
| `validateTicketOrderPosition`, `createTicketOrderPositionValidator({ getSaleRules })` | `orders.validateOrderPosition` that enforces supply, cancelled events and sale rules |
| `createTicketingRoles({ canAccessEvent })`, `configureTicketingRoles` | The `ticketing` role, for projects that build their roles themselves |
| `ticketingTypeDefs`, `ticketingResolvers`, `ticketingServices`, `ticketingActions`, `ticketingModules` | The building blocks `withTicketing` uses, for custom schemas |
| `buildTicketsPdfUrl`, `buildWalletPassUrls`, `getTicketAttachments` | Ticket links and e-mail attachments |
| `buildTicketScanPayload`, `parseTicketScanPayload` | The QR code content of a ticket, and its parser |
| `getTicketEventDetails`, `TicketEventProperty`, `isTicketEventCancelled`, `isTicketCancelled`, `getTicketStatus`, `TicketStatus` | Event facts and ticket state |
| `TicketingEventTypes`, `registerTicketingEvents` | `TICKET_REDEEMED`, `TICKET_CANCELLED`, `TICKET_EVENT_CANCELLED` |
| `getTicketingPaths()` | The route base paths (for the Apple `webServiceURL`) |
| `registerTicketingTemplates`, `TicketingMessageTypes` | The `EVENT_CANCELLED` / `TICKET_CANCELLED` templates |
| Types | `TicketingAPI`, `TicketingModule`, `TicketingServices`, `PDFRenderer`, `PassRenderer`, `GoogleWalletPassRenderer`, `TicketSaleRules`, `CanAccessTicketEvent`, … |

### Subpaths

| Import | Description |
| ------ | ----------- |
| `@unchainedshop/ticketing/warehousing/ticket` | `TicketWarehousingPlugin`, `createTicketWarehousingPlugin({ ticketMeta })`: the ticket issuer |
| `@unchainedshop/ticketing/pricing/discount-reimbursement-code` | `ReimbursementCodePlugin`: accepts reimbursement codes at checkout |
| `@unchainedshop/ticketing/admin-plugin` | `ticketingAdminPlugin()`: the **Ticketing** menu of the Admin UI |

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `UNCHAINED_SECRET` | Required, derives the magic keys |
| `ROOT_URL` | Public URL of the engine for ticket links |
| `UNCHAINED_PDF_PRINT_HANDLER_PATH` | Tickets PDF route, default `/rest/print_tickets` |
| `GOOGLE_WALLET_WEBSERVICE_PATH` | Google Wallet route, default `/rest/google-wallet` |
| `APPLE_WALLET_WEBSERVICE_PATH` | Apple Wallet download and PassKit web service, default `/rest/apple-wallet` |
| `PASS_CERTIFICATE_PATH`, `PASS_CERTIFICATE_SECRET` | Apple pass certificate and key (PEM) and passphrase, for push updates with `@parse/node-apn` |
| `DISCOUNT_CODE_SECRET` | 32 bytes as hex, signs reimbursement codes |

## License

EUPL-1.2
