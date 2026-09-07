# Kitchensink Example (Express)

Full-featured example of the Unchained Engine using Express as the HTTP server. Alternative to the Fastify version for teams preferring Express.

## Features

- **Express** HTTP server
- **GraphQL API** with GraphQL Yoga
- **All official plugins** via `@unchainedshop/plugins/presets/all`
- **AI Chat integration** (OpenAI compatible, including local LLMs)
- **Image generation** with OpenAI DALL-E
- **Discount plugins** (half-price manual, 100-off)
- **Database seeding** with admin user, country, currency, language, and providers
- **Development access token** for testing (`admin` / `secret`)

The Admin UI is served at `/`, with the local Bookmark Manager extension registered.

## Prerequisites

- Node.js >= 24
- MongoDB (or uses in-memory MongoDB for development)

## Quick Start

```bash
npm install
npm --prefix plugins/bookmark-manager install
npm run dev
```

Server starts at http://localhost:4010 with:
- GraphQL endpoint: `/graphql`
- Admin UI: `/`
- Default login: `admin@unchained.local` / `password`

## Developing Admin UI extensions

Run `npm run dev` from this example directory and open http://localhost:4010.
The backend serves the prebuilt `@unchainedshop/admin-ui` package and the local
Bookmark Manager extension. The command builds the extension before starting
the backend, then watches both the backend and extension source files.

Edit `plugins/bookmark-manager/src/`, wait for a successful rebuild, and refresh
the browser. With `NODE_ENV` different from `production`, the backend serves
the changed bundle without restarting. Registration changes in `src/boot.ts`
restart the backend through Node's watcher.

For a standalone client project, replace the plugin package's repository-local
`file:` dependencies with published versions of `@unchainedshop/admin-ui` and
`@unchainedshop/client`. Use the same Admin UI version in the host and plugin.
Inside this monorepo, first run `npm run build:admin-ui` and
`npm --prefix admin-ui run build:client` from the root to supply the packaged
artifacts. A Next.js dev server is not needed for extension development.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build plugin, then watch backend and plugin |
| `npm run dev:server` | Watch backend only |
| `npm run dev:plugin` | Watch and rebuild the local Admin UI plugin |
| `npm run build:plugin` | Build the local Admin UI plugin once |
| `npm run build` | Build TypeScript to `lib/` |
| `npm start` | Start production server |
| `npm run test-mcp` | Test MCP server with inspector |
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

```bash
docker build -t unchained-kitchensink-express .
docker run -p 4010:4010 unchained-kitchensink-express
```

## License

EUPL-1.2
