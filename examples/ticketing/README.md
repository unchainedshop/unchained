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

- Node.js 26.8.2 or newer (26.8.2 is pinned) for repository development (see [`.nvmrc`](../../.nvmrc))
- MongoDB (or uses in-memory MongoDB for development)

## Quick Start

From the repository root:

```bash
npm install
npm run build
cd examples/ticketing
npm run dev
```

The remaining commands run from `examples/ticketing/`.

Server starts at http://localhost:4010 with:
- GraphQL endpoint: `/graphql`
- Default login: `admin@unchained.local` / `password`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with watch mode |
| `npm run build` | Build TypeScript to `lib/` |
| `npm start` | Start production server |
| `npm run test:run:integration` | Run integration tests |
| `npm run lint` | Format code with Prettier |

## Environment Variables

### Server configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ROOT_URL` | Public URL of the server | `http://localhost:4010` |
| `PORT` | Server port | `4010` |
| `UNCHAINED_TOKEN_SECRET` | Session secret (at least 32 characters); replace the bundled development value for deployment | Development value in `.env.defaults` |
| `UNCHAINED_SECRET` | Secret for magic key encryption | `secret` |
| `EMAIL_FROM` | Default sender email | `noreply@unchained.local` |
| `EMAIL_WEBSITE_NAME` | Website name for emails | `Unchained` |
| `EMAIL_WEBSITE_URL` | Website URL for emails | `http://localhost:4010` |

### Seeding

| Variable | Description | Default |
|----------|-------------|---------|
| `UNCHAINED_SEED_PASSWORD` | Admin password (`generate` for random) | `password` |
| `UNCHAINED_COUNTRY` | Default country ISO code | `CH` |
| `UNCHAINED_CURRENCY` | Default currency ISO code | `CHF` |
| `UNCHAINED_LANG` | Default language ISO code | `de` |

### Apple Wallet push notifications (Optional)

| Variable | Description |
|----------|-------------|
| `PASS_CERTIFICATE_PATH` | Certificate and key option passed to `https.request` for Apple push notifications |
| `PASS_CERTIFICATE_SECRET` | PEM passphrase |

## Ticketing Setup

The example includes logging placeholders for ticket rendering. They must be replaced with a readable PDF stream and wallet pass objects before ticket downloads can work:

```typescript
setupTicketing(platform.unchainedAPI, {
  renderOrderPDF: () => { /* Implement PDF generation */ },
  createAppleWalletPass: () => { /* Implement Apple Wallet pass */ },
  createGoogleWalletPass: () => { /* Implement Google Wallet pass */ },
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

Tests are located in the `tests/` directory. The checked-in boot callbacks only log messages, so the successful-download cases require working renderers and suitable order/token fixtures.

## Docker

Build from the repository root so Docker can resolve every npm workspace from the root lockfile:

```bash
docker build -f examples/ticketing/Dockerfile -t unchained-ticketing .
docker run --rm -p 4010:3000 \
  -e MONGO_URL=mongodb://host.docker.internal:27017/unchained \
  unchained-ticketing
```

`host.docker.internal` is available in Docker Desktop; for other deployments use your MongoDB service address. The image listens on container port `3000`. Configure production secrets and provider credentials as described in the [Docker deployment guide](../../docs/docs/deployment/docker.md).

## License

EUPL-1.2
