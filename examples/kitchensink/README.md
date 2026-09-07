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
- Target-permission test login: `user-manager@unchained.local` / `password`

The `userManager` role is configured to expose all read-only user tabs while varying mutations by
the target user's seed tag. Use the user manager login and compare these users in the Admin UI:

| Target user                       | Expected permissions                                        |
| --------------------------------- | ----------------------------------------------------------- |
| `admin` or `user-manager-peer`    | Read-only; no set-password, force-logout, or delete control |
| `user-manager` (your own account) | Normal logged-in self-service permissions                   |
| `readonly-customer`               | Read-only; all user-data tabs remain visible                |
| `managed-customer`                | Editable and force-logout capable, but cannot be deleted    |
| `disposable-customer`             | Editable, force-logout capable, and deletable               |

## Developing Admin UI extensions

Run `npm run dev` from this example directory and open http://localhost:4010.
The backend serves the prebuilt `@unchainedshop/admin-ui` package and the local
Bookmark Manager extension. The command builds the extension before starting
the backend, then watches both the backend and extension source files.

Edit `plugins/bookmark-manager/src/`, wait for the plugin build to succeed, and
refresh the browser. The backend reads the updated bundle without a restart
when `NODE_ENV` is not `production`. Changes to the plugin registration in
`src/boot.ts` restart the backend through Node's watcher.

For a standalone client project, install published versions of
`@unchainedshop/admin-ui` and `@unchainedshop/client` in the plugin package in
place of this repository's `file:` dependencies. Keep the host and plugin on
the same Admin UI version. No Admin UI source checkout or Next.js dev server
is needed. Inside this monorepo, build the Admin UI and client once with
`npm run build:admin-ui` and `npm --prefix admin-ui run build:client` from the
repository root to supply the artifacts that the published packages include.

## Scripts

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run dev`              | Build plugin, then watch backend and plugin |
| `npm run dev:server`       | Watch backend only |
| `npm run dev:plugin`       | Watch and rebuild the local Admin UI plugin |
| `npm run build:plugin`     | Build the local Admin UI plugin once |
| `npm run build`            | Build TypeScript to `lib/`               |
| `npm start`                | Start production server                  |
| `npm run integration-test` | Run with integration test environment    |
| `npm run lint`             | Format code with Prettier                |

## Environment Variables

### Required

| Variable                 | Description                              | Default                   |
| ------------------------ | ---------------------------------------- | ------------------------- |
| `ROOT_URL`               | Public URL of the server                 | `http://localhost:4010`   |
| `PORT`                   | Server port                              | `4010`                    |
| `UNCHAINED_TOKEN_SECRET` | Secret for session tokens (min 32 chars) | -                         |
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

### AI/Chat (Optional)

| Variable          | Description                           |
| ----------------- | ------------------------------------- |
| `OPENAI_BASE_URL` | OpenAI-compatible API base URL        |
| `OPENAI_MODEL`    | Model name for chat                   |
| `OPENAI_API_KEY`  | OpenAI API key (for image generation) |

To use a local LLM:

```bash
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
```

> **Note:** Using llama.cpp with a local server is currently not possible because the Unchained MCP Zod schema has date patterns that llama.cpp cannot handle. See: https://github.com/ggml-org/llama.cpp/issues/12252

Then set:

```
OPENAI_BASE_URL=http://127.0.0.1:8080/v1
OPENAI_MODEL=gpt-oss
```

### Admin UI

| Variable                                     | Description                    |
| -------------------------------------------- | ------------------------------ |
| `UNCHAINED_ADMIN_UI_DEFAULT_PRODUCT_TAGS`    | Default product tags           |
| `UNCHAINED_ADMIN_UI_DEFAULT_ASSORTMENT_TAGS` | Default assortment tags        |
| `UNCHAINED_ADMIN_UI_DEFAULT_USER_TAGS`       | Default user tags              |
| `UNCHAINED_ADMIN_UI_SINGLE_SIGN_ON_URL`      | SSO URL for admin UI           |
| `UNCHAINED_ADMIN_UI_CUSTOM_PROPERTIES`       | Path to custom properties JSON |

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
