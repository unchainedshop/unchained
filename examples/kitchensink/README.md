# Kitchensink Example (Fastify)

Full-featured example of the Unchained Engine using Fastify as the HTTP server. This is the recommended starting point for new projects.

## Features

- **Fastify** HTTP server with custom Unchained logger
- **GraphQL API** with GraphQL Yoga
- **Admin UI** integration (served at `/`)
- **All official plugins** via `@unchainedshop/plugins/presets/all`
- **Ticketing support** with `@unchainedshop/ticketing`
- **AI Chat integration** (OpenAI compatible, including local LLMs)
- **Image generation** with OpenAI DALL-E
- **Discount plugins** (half-price manual, 100-off)
- **Product discoverability filter** (hide products by tag)
- **Database seeding** with admin user, country, currency, language, and providers
- **Development access token** for testing (`admin` / `secret`)

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

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `ROOT_URL` | Public URL of the server | `http://localhost:4010` |
| `PORT` | Server port | `4010` |
| `UNCHAINED_TOKEN_SECRET` | Secret for session tokens (min 32 chars) | - |
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
| `OPENAI_BASE_URL` | OpenAI-compatible API base URL |
| `OPENAI_MODEL` | Model name for chat |
| `OPENAI_API_KEY` | OpenAI API key (for image generation) |

To use a local LLM:
```bash
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
```

Then set:
```
OPENAI_BASE_URL=http://127.0.0.1:8080/v1
OPENAI_MODEL=gpt-oss
```

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
- Country: Switzerland (CH)
- Currency: Swiss Franc (CHF)
- Language: German (de)
- Delivery provider: Send Message
- Payment provider: Invoice

## Docker

```bash
docker build -t unchained-kitchensink .
docker run -p 4010:4010 unchained-kitchensink
```

## License

EUPL-1.2
