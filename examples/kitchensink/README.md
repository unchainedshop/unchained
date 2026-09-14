# Kitchensink Example (Fastify)

Full-featured example of the Unchained Engine using Fastify as the HTTP server. This is the recommended starting point for new projects.

## Features

- **Fastify** HTTP server with custom Unchained logger
- **GraphQL API** with GraphQL Yoga
- **Admin UI** integration (served at `/`)
- **Broad plugin preset** via `@unchainedshop/plugins/presets/all.js`
- **Ticketing example** available separately in [`../ticketing`](../ticketing/README.md)
- **AI Chat integration** with OpenAI (enabled when `OPENAI_API_KEY` is set)
- **Image generation** with OpenAI `gpt-image-1`
- **Discount plugins** (half-price manual, 100-off)
- **Product discoverability filter** (hide products by tag)
- **Database seeding** with admin user, country, currency, language, and providers
- **Development access token** generated and logged on startup for the seeded administrator

## Prerequisites

- Node.js 26.8.2 or newer (26.8.2 is pinned) for repository development (see [`.nvmrc`](../../.nvmrc))
- MongoDB (or uses in-memory MongoDB for development)

## Quick Start

From the repository root:

```bash
npm install
npm run build
cd examples/kitchensink
npm run dev
```

The remaining commands run from `examples/kitchensink/`.

Server starts at http://localhost:4010 with:
- GraphQL endpoint: `/graphql`
- Admin UI: `/`
- Default login: `admin@unchained.local` / `password`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with watch mode |
| `npm run build` | Build TypeScript to `lib/` |
| `npm start` | Start production server |
| `npm run integration-test` | Run with integration test environment |
| `npm run lint` | Format code with Prettier |

## Environment Variables

### Server configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ROOT_URL` | Public URL of the server | `http://localhost:4010` |
| `PORT` | Server port | `4010` |
| `UNCHAINED_TOKEN_SECRET` | Session secret (at least 32 characters); replace the bundled development value for deployment | Development value in `.env.defaults` |
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

### AI/Chat (Optional)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Enables chat and the `gpt-image-1` image generation tool |
| `OPENAI_MODEL` | Chat model passed to the provider; defaults to `gpt-5.2` in `src/boot.ts` |

Set these values in `.env`. For an OpenAI-compatible local endpoint, use the [Express example](../kitchensink-express/README.md), which configures `createOpenAICompatible` from `OPENAI_BASE_URL` and `OPENAI_MODEL`.

### Admin UI

| Variable | Description |
|----------|-------------|
| `UNCHAINED_ADMIN_UI_DEFAULT_PRODUCT_TAGS` | Default product tags |
| `UNCHAINED_ADMIN_UI_DEFAULT_ASSORTMENT_TAGS` | Default assortment tags |
| `UNCHAINED_ADMIN_UI_DEFAULT_USER_TAGS` | Default user tags |
| `UNCHAINED_ADMIN_UI_SINGLE_SIGN_ON_URL` | SSO URL for admin UI |
| `UNCHAINED_ADMIN_UI_CUSTOM_PROPERTIES` | Path to custom properties JSON |

## Database Seeding

On first start, the seed script creates:
- Admin user: `admin@unchained.local`
- Countries: Switzerland (CH) and United States (US), plus `UNCHAINED_COUNTRY` if different
- Currencies: Swiss Franc (CHF) and US Dollar (USD), plus `UNCHAINED_CURRENCY` if different
- Language: German (de)
- Delivery provider: Send Message
- Payment provider: Invoice

## Docker

Build from the repository root so Docker can resolve every npm workspace from the root lockfile:

```bash
docker build -f examples/kitchensink/Dockerfile -t unchained-kitchensink .
docker run --rm -p 4010:3000 \
  -e MONGO_URL=mongodb://host.docker.internal:27017/unchained \
  unchained-kitchensink
```

`host.docker.internal` is available in Docker Desktop; for other deployments use your MongoDB service address. The image listens on container port `3000`. Configure production secrets and provider credentials as described in the [Docker deployment guide](../../docs/docs/deployment/docker.md).

## License

EUPL-1.2
