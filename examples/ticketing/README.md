# Ticketing Example

Example demonstrating the Unchained Engine ticketing extension for event tickets and digital passes.

## Features

- **Fastify** HTTP server with custom Unchained logger
- **Base plugins** via `@unchainedshop/plugins/presets/base`
- **Ticketing module** with `@unchainedshop/ticketing`
- **PDF ticket rendering** (placeholder implementation)
- **Apple Wallet pass** generation (placeholder implementation)
- **Google Wallet pass** generation (placeholder implementation)
- **Magic key order access** for ticket retrieval without login
- **Database seeding** with admin user, country, currency, language, and providers
- **Integration tests** for ticketing functionality

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
- Default login: `admin@unchained.local` / `password`

## Scripts

| Command                        | Description                              |
| ------------------------------ | ---------------------------------------- |
| `npm run dev`                  | Start development server with watch mode |
| `npm run build`                | Build TypeScript to `lib/`               |
| `npm start`                    | Start production server                  |
| `npm run test:run:integration` | Run integration tests                    |
| `npm run lint`                 | Format code with Prettier                |

## Environment Variables

### Required

| Variable                 | Description                                      | Default                   |
| ------------------------ | ------------------------------------------------ | ------------------------- |
| `ROOT_URL`               | Public URL of the server                         | `http://localhost:4010`   |
| `PORT`                   | Server port                                      | `4010`                    |
| `UNCHAINED_TOKEN_SECRET` | Secret for session tokens (min 32 chars)         | -                         |
| `UNCHAINED_SECRET`       | Secret used to derive reusable order access keys | `secret`                  |
| `EMAIL_FROM`             | Default sender email                             | `noreply@unchained.local` |
| `EMAIL_WEBSITE_NAME`     | Website name for emails                          | `Unchained`               |
| `EMAIL_WEBSITE_URL`      | Website URL for emails                           | `http://localhost:4010`   |

### Seeding

| Variable                  | Description                            | Default    |
| ------------------------- | -------------------------------------- | ---------- |
| `UNCHAINED_SEED_PASSWORD` | Admin password (`generate` for random) | `password` |
| `UNCHAINED_COUNTRY`       | Default country ISO code               | `CH`       |
| `UNCHAINED_CURRENCY`      | Default currency ISO code              | `CHF`      |
| `UNCHAINED_LANG`          | Default language ISO code              | `de`       |

## Ticketing Setup

### Gate access and reimbursements

Gate operators sign in with a regular user account. Assign the `ticketing` role configured in
`boot.ts`, or grant the `scanTicket` action to a custom role. **Ticketing → Gate Control** then
appears in the Admin UI, with access to active events and their attendees. Administrators have
access automatically. Guests and ordinary customers cannot use gate control. Event pass codes
and gate cookies are no longer supported.

Product managers see **Ticketing → Events** and can include draft events. Individual ticket
cancellation uses the separate `cancelTicket` action (granted to administrators by default).
The ticketing-only `scanTicket` mutation redeems eligible tickets without granting token export,
cancellation, or reimbursement permissions. Ticketing pages and GraphQL fields are registered by
the extension; shops that do not load it do not expose ticketing navigation or schema fields.

To redeem reimbursement codes, register `ReimbursementCodePlugin` from
`@unchainedshop/plugins/pricing/discount-reimbursement-code` with `pluginRegistry` before starting
the platform. Set `DISCOUNT_CODE_SECRET` to a persistent, private 32-byte hex value, for example
generated with `openssl rand -hex 32`. Without this secret the default handler rejects issuance
and redemption; other ticketing features remain available. Credit generation is validated before
tickets are cancelled.

The default `v1` code format signs the exact integer minor-unit amount, currency, and a random
128-bit identifier. Legacy codes from the earlier default format must be reissued. Custom
`TicketingOptions.discountCode` handlers remain supported; they receive the currency as an optional
second argument and should enforce currency restrictions themselves.

Reimbursement amounts use the configured catalog unit price multiplied by the cancelled token
quantity. Voucher balances use integer minor units and include pending orders. Checkout reserves
the applied amount before payment and releases the reservation after the order status is saved,
or on payment failure. After a process crash, retry the original checkout or remove its cart
discount to release a stranded reservation; do not clear reservations for payments still in flight.

Admin plugin pages require a non-guest authenticated user by default. The gate page explicitly
sets `publicAccess: true`; this option does not bypass a page's `requiredRole`.

The example includes placeholder implementations for ticket rendering:

```typescript
setupTicketing(platform.unchainedAPI, {
  renderOrderPDF: () => {
    /* Implement PDF generation */
  },
  createAppleWalletPass: () => {
    /* Implement Apple Wallet pass */
  },
  createGoogleWalletPass: () => {
    /* Implement Google Wallet pass */
  },
});
```

### Implementing PDF Tickets

```tsx
import ReactPDF from '@react-pdf/renderer';

const renderOrderPDF = async ({ orderId }, { modules }) => {
  const order = await modules.orders.findOrder({ orderId });
  return ReactPDF.renderToStream(<TicketDocument order={order} />);
};
```

### Implementing Wallet Passes

See the [@unchainedshop/ticketing](../../packages/ticketing/README.md) documentation for detailed implementation guides.

## Database Seeding

On first start, the seed script creates:

- Admin user: `admin@unchained.local`
- Country: Switzerland (CH)
- Currency: Swiss Franc (CHF)
- Language: German (de)
- Delivery provider: Send Message
- Payment provider: Invoice

## Testing

Run integration tests:

```bash
npm run test:run:integration
```

Tests are located in the `tests/` directory.

## Docker

```bash
docker build -t unchained-ticketing .
docker run -p 4010:3000 --env-file .env unchained-ticketing
```

## License

EUPL-1.2
