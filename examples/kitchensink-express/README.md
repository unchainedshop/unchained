# Kitchensink Example (Express)

Full-featured example of the Unchained Engine using Express as the HTTP server. Alternative to the Fastify version for teams preferring Express.

## Features

- **Express** HTTP server
- **GraphQL API** with GraphQL Yoga
- **Broad plugin preset** via `@unchainedshop/plugins/presets/all.js`
- **AI Chat integration** (OpenAI compatible, including local LLMs)
- **Image generation** with OpenAI `gpt-image-1`
- **Discount plugins** (half-price manual, 100-off)
- **Database seeding** with admin user, country, currency, language, and providers
- **Development access token** generated and logged on startup for the seeded administrator

> **Note:** Admin UI is disabled by default in this example (`adminUI: false`). Use the Fastify kitchensink for the full admin experience.

## Prerequisites

- Node.js 26.8.2 or newer (26.8.2 is pinned) for repository development (see [`.nvmrc`](../../.nvmrc))
- MongoDB (or uses in-memory MongoDB for development)

## Quick Start

From the repository root:

```bash
npm install
npm run build
cd examples/kitchensink-express
npm run dev
```

The remaining commands run from `examples/kitchensink-express/`.

Server starts at http://localhost:4010 with:
- GraphQL endpoint: `/graphql`
- Default login: `admin@unchained.local` / `password`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with watch mode |
| `npm run dev:run` | Start development server without watch |
| `npm run build` | Build TypeScript to `lib/` |
| `npm start` | Start production server |
| `npm run test-mcp` | Test MCP server with inspector |
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
| `OPENAI_BASE_URL` | OpenAI-compatible API base URL |
| `OPENAI_MODEL` | Model name for chat |
| `OPENAI_API_KEY` | OpenAI API key (for image generation) |

Chat is enabled only when both `OPENAI_BASE_URL` and `OPENAI_MODEL` are set. Point them at an OpenAI-compatible server that supports tool calling:

```bash
OPENAI_BASE_URL=http://127.0.0.1:8080/v1
OPENAI_MODEL=your-served-model
```

`OPENAI_API_KEY` enables the image generation tool within an enabled chat configuration. Model and tool-schema compatibility depend on the server you run.

## Database Seeding

On first start, the seed script creates:
- Admin user: `admin@unchained.local`
- Country: Switzerland (CH)
- Currency: Swiss Franc (CHF)
- Language: German (de)
- Delivery provider: Send Message
- Payment provider: Invoice

## MCP Server Testing

Test the Model Context Protocol server:

```bash
npm run test-mcp
```

This launches the MCP inspector to debug and test MCP tools.

## Docker

Build from the repository root so Docker can resolve every npm workspace from the root lockfile:

```bash
docker build -f examples/kitchensink-express/Dockerfile -t unchained-kitchensink-express .
docker run --rm -p 4010:3000 \
  -e MONGO_URL=mongodb://host.docker.internal:27017/unchained \
  unchained-kitchensink-express
```

`host.docker.internal` is available in Docker Desktop; for other deployments use your MongoDB service address. The image listens on container port `3000`. Configure production secrets and provider credentials as described in the [Docker deployment guide](../../docs/docs/deployment/docker.md).

## License

EUPL-1.2
