# Ticketing Example

Example demonstrating event ticketing with `@unchainedshop/ticketing`: selling tickets, redeeming them at the gate, cancelling them, and the ticket routes.

## Features

- **Fastify** HTTP server with the Unchained logger
- **Base plugins** via `@unchainedshop/plugins/presets/base`
- **Ticketing plugin** (`createTicketingPlugin`): passes module, ticket PDF and wallet routes, magic-key order access, cancellation e-mails
- **Ticket issuer** (`createTicketWarehousingPlugin`) with attendee names per seat (order position configuration `attendees`)
- **Box office** (`BoxOfficePlugin`): door sales by gate staff, paid at the counter
- **Sales within supply** (`validateTicketOrderPosition`)
- **Reimbursement codes** (`ReimbursementCodePlugin`)
- **Admin UI** with **Ticketing → Events**, **Gate Control**, **Box Office** and **Sales Report**
- **Seed data**: admin and gate staff accounts, providers, the ticket issuer and a demo event
- **Integration tests** for buying, looking up, redeeming and cancelling tickets and for the ticket routes

The example registers no renderers, so the tickets PDF and the wallet routes answer `404` (`Ticket PDF not configured`, …). [Ticket Renderers](../../docs/docs/guides/ticketing-renderers.md) builds all three.

## Prerequisites

- Node.js >=26
- MongoDB (or starts a local MongoDB instance with data stored in `.db`)

## Quick Start

```bash
npm install
npm run dev
```

Server starts at http://localhost:4010 with:

- GraphQL endpoint: `/graphql`
- Admin UI: `/`
- Logins: `admin@unchained.local` (administrator) and `gate@unchained.local` (gate staff), both with password `password`

## Scripts

| Command                        | Description                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| `npm run dev`                  | Start development server with watch mode                          |
| `npm run build`                | Build TypeScript to `lib/`                                        |
| `npm start`                    | Start production server                                           |
| `npm run test:run:integration` | Start the example against the test settings and run `tests/`      |
| `npm run lint`                 | Format code with Prettier                                         |

## Environment Variables

### Required

| Variable                 | Description                                            | Default                   |
| ------------------------ | ------------------------------------------------------ | ------------------------- |
| `ROOT_URL`               | Public URL of the server, used for ticket links        | `http://localhost:4010`   |
| `PORT`                   | Server port                                            | `4010`                    |
| `UNCHAINED_TOKEN_SECRET` | Secret for session tokens (min 32 chars)               | -                         |
| `UNCHAINED_SECRET`       | Derives the magic keys that open orders without login  | `secret`                  |
| `EMAIL_FROM`             | Default sender email                                   | `noreply@unchained.local` |
| `EMAIL_WEBSITE_NAME`     | Website name for emails                                | `Unchained`               |
| `EMAIL_WEBSITE_URL`      | Website URL for emails                                 | `http://localhost:4010`   |

### Ticketing

| Variable                         | Description                                                              | Default                              |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| `DISCOUNT_CODE_SECRET`           | 32 bytes as hex, signs reimbursement codes (`openssl rand -hex 32`)      | a development-only value             |
| `UNCHAINED_TOKEN_EXPIRY_SECONDS` | Login lifetime; raise it for gate shifts (applies to all users)          | `3600`                               |

### Seeding

| Variable                  | Description                                  | Default    |
| ------------------------- | -------------------------------------------- | ---------- |
| `UNCHAINED_SEED_PASSWORD` | Password of both accounts (`generate` for random) | `password` |
| `UNCHAINED_COUNTRY`       | Default country ISO code                     | `CH`       |
| `UNCHAINED_CURRENCY`      | Default currency ISO code                    | `CHF`      |
| `UNCHAINED_LANG`          | Default language ISO code                    | `de`       |

## Ticketing Setup

`boot.ts` registers the plugins before `startPlatform` and passes the platform options through `withTicketing`:

```typescript
pluginRegistry.register(createTicketingPlugin());
pluginRegistry.register(createTicketWarehousingPlugin());
pluginRegistry.register(BoxOfficePlugin);
pluginRegistry.register(ReimbursementCodePlugin);

const platform = await startPlatform(
  withTicketing({ options: { orders: { validateOrderPosition: validateTicketOrderPosition } } }),
);

await connect(fastify, platform, { adminUI: { plugins: [ticketingAdminPlugin()] } });
```

`connect()` mounts the ticketing routes with the other plugin routes; there is no separate ticketing connector.

### Selling tickets

`seed.ts` creates the one `VIRTUAL` warehousing provider with the ticket issuer (`shop.unchained.warehousing.ticket`; gates open 120 minutes before the start and close 60 minutes after it) and the demo event "Unchained Live": a tokenized product with a supply of 500 tickets whose start, location, duration, doors and category are stored in `product.meta`. The event starts one hour after the first boot; move it in **Ticketing → Events** or with `updateTicketEvent`.

Each seat becomes one ticket with its own serial number. The storefront passes attendee names as the order position configuration `attendees`, and the ticket issuer stores one per ticket (`Token.attendeeName`; a `ticketMeta` hook replaces this, `readAttendeeName` reads the configuration in your own hook):

```graphql
mutation AddTickets {
  addCartProduct(
    productId: "<event id>"
    quantity: 2
    configuration: [{ key: "attendees", value: "Ada Lovelace, Alan Turing" }]
  ) {
    _id
  }
}
```

`validateTicketOrderPosition` refuses more tickets than the supply (`TicketSoldOutError`) and tickets of cancelled events.

### Gate access

Gate staff sign in with a regular account that has the `ticketing` role (`gate@unchained.local`), or a custom role with the `scanTicket` action. **Ticketing → Gate Control** then lists the events and scans or looks up tickets; `scanTicket(tokenId, productId)` redeems them. The ticket list shows the attendee name and the buyer's public profile; private user data stays behind `viewUserPrivateInfos`. Pass codes and gate cookies are not supported.

### Box office and sales report

Gate staff (`ticketing` role, action `sellAtBoxOffice`) sell tickets at the door in **Ticketing → Box Office**: pick a performance, the number of tickets per category, optional attendee names per seat and buyer details, and sell. The order is placed on the staff member's account and paid with the box office payment provider that `seed.ts` creates; customers never get that provider. Tickets can be admitted right away.

**Ticketing → Sales Report** (action `viewTicketSalesReport`, administrators by default) shows the orders, tickets and revenue per performance and per payment provider of a period, with CSV downloads.

Users with `manageProducts` see **Ticketing → Events**, including drafts, and edit the event details. Cancelling a ticket or an event, with or without a reimbursement code, requires the `cancelTicket` action (administrators by default).

### Reimbursement codes

`ReimbursementCodePlugin` accepts the codes `cancelTicket` and `cancelEvent` issue with `generateDiscount: true`. They are signed with `DISCOUNT_CODE_SECRET`, which must be 32 random bytes as hex; `.env.defaults` contains a development-only value, set your own in production. A value in another format stops the engine at startup.

The default `v1` code format signs the integer minor-unit amount, the order currency and a random identifier. Custom `discountCode: { generate, verify }` handlers passed to `createTicketingPlugin()` keep other code formats working. Reimbursement amounts use the catalog unit price times the cancelled token quantity; voucher balances include pending orders, and checkout reserves the applied amount until the order status is saved.

### Tickets PDF and wallet passes

Add the renderers from [Ticket Renderers](../../docs/docs/guides/ticketing-renderers.md) to `createTicketingPlugin()`:

```typescript
pluginRegistry.register(
  createTicketingPlugin({ renderOrderPDF, createAppleWalletPass, createGoogleWalletPass }),
);
```

The buyer (or anyone with the order's magic key) then gets the PDF link as `Order.ticketsPdfUrl`, and the wallet links are `/rest/apple-wallet/download/<tokenId>.pkpass?hash=<accessKey>` and `/rest/google-wallet/download/<tokenId>?hash=<accessKey>`.

## Testing

```bash
npm run test:run:integration
```

This starts the example with the root `.env.tests` settings and runs `tests/`: `tickets.test.js` moves the demo event to today, buys two tickets as a guest, checks the supply limit, the magic key and the routes, looks a scanned QR code up and redeems it as gate staff, and refuses a cancelled ticket at the gate. The example database is kept in `.db`; the tests work on repeated runs.

## Docker

```bash
docker build -t unchained-ticketing .
docker run -p 4010:3000 --env-file .env unchained-ticketing
```

## License

EUPL-1.2
