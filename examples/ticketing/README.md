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

- Node.js >= 22
- MongoDB (or uses in-memory MongoDB for development)

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

| Variable                 | Description                              | Default                   |
| ------------------------ | ---------------------------------------- | ------------------------- |
| `ROOT_URL`               | Public URL of the server                 | `http://localhost:4010`   |
| `PORT`                   | Server port                              | `4010`                    |
| `UNCHAINED_TOKEN_SECRET` | Secret for session tokens (min 32 chars) | -                         |
| `UNCHAINED_SECRET`       | Secret for magic key encryption          | `secret`                  |
| `EMAIL_FROM`             | Default sender email                     | `noreply@unchained.local` |
| `EMAIL_WEBSITE_NAME`     | Website name for emails                  | `Unchained`               |
| `EMAIL_WEBSITE_URL`      | Website URL for emails                   | `http://localhost:4010`   |

### Seeding

| Variable                  | Description                            | Default    |
| ------------------------- | -------------------------------------- | ---------- |
| `UNCHAINED_SEED_PASSWORD` | Admin password (`generate` for random) | `password` |
| `UNCHAINED_COUNTRY`       | Default country ISO code               | `CH`       |
| `UNCHAINED_CURRENCY`      | Default currency ISO code              | `CHF`      |
| `UNCHAINED_LANG`          | Default language ISO code              | `de`       |

### Apple Wallet (Optional)

| Variable                  | Description                          |
| ------------------------- | ------------------------------------ |
| `PASS_CERTIFICATE_PATH`   | Path to Apple pass certificate (PEM) |
| `PASS_CERTIFICATE_SECRET` | PEM passphrase                       |
| `PASS_TEAM_ID`            | Apple Developer Team ID              |

## Ticketing Setup

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

```typescript
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
docker run -p 4010:4010 unchained-ticketing
```

## License

EUPL-1.2
