[![npm version](https://img.shields.io/npm/v/@unchainedshop/api.svg)](https://npmjs.com/package/@unchainedshop/api)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/api

GraphQL API using Yoga, HTTP adapters for Express and Fastify, and an MCP server for AI integrations.

## Installation

```bash
npm install @unchainedshop/api
```

Install your chosen HTTP framework separately. Most applications obtain the core and GraphQL handler through `startPlatform()` from `@unchainedshop/platform`; the examples below assume an initialized `unchainedCore`.

## Express

```typescript
import express from 'express';
import { startAPIServer } from '@unchainedshop/api';
import { connect } from '@unchainedshop/api/express';

const app = express();
const graphqlHandler = await startAPIServer({ unchainedAPI: unchainedCore });
await connect(app, { graphqlHandler, unchainedAPI: unchainedCore }, {
  adminUI: true,
});
app.listen(4010);
```

## Fastify

```typescript
import Fastify from 'fastify';
import { connect } from '@unchainedshop/api/fastify';

const fastify = Fastify();
await connect(fastify, { graphqlHandler, unchainedAPI: unchainedCore });
await fastify.listen({ port: 4010 });
```

`connect()` mounts the GraphQL endpoint, `/mcp`, and routes supplied by registered plugins. Admin UI hosting requires the optional `@unchainedshop/admin-ui` package; Fastify also needs `@fastify/static`. Configure a prefix with `{ adminUI: { prefix: '/admin' } }` in the third argument to `connect()`.

## API overview

| Export | Purpose |
|--------|---------|
| `startAPIServer` | Create a GraphQL Yoga server with the built-in schema |
| `createContextResolver` | Create a request context resolver |
| `getCurrentContextResolver` | Read the configured resolver |
| `setCurrentContextResolver` | Replace the configured resolver |
| `Context` | GraphQL context type |
| `UnchainedLocaleContext` | Country, currency, and locale context type |
| `UnchainedLoaders` | Request-scoped data loader types |
| `acl` | Access control utilities |
| `roles` | Role configuration and permission actions (`roles.actions`) |

The HTTP subpaths export `connect`, `adminUIRouter`, `connectChat`, and Admin UI configuration types. The main package exports domain-specific errors such as `ProductNotFoundError`, `OrderNotFoundError`, `UserNotFoundError`, `NoPermissionError`, and `InvalidIdError`.

## Extending the server

```typescript
const graphqlHandler = await startAPIServer({
  unchainedAPI: unchainedCore,
  adminUiConfig: {
    defaultProductTags: ['featured'],
  },
  context: (defaultResolver) => async (props, req, res) => ({
    ...(await defaultResolver(props, req, res)),
    // Additional request context
  }),
  typeDefs: [
    // Additional GraphQL type definitions
  ],
  resolvers: [
    // Additional resolvers
  ],
});
```

The built-in schema provides queries and mutations for catalog management, orders, checkout, authentication, and other commerce operations. See [schema composition](src/schema/index.ts), [server options](src/createGraphQLServer.ts), and [context options](src/context.ts).

## MCP and chat

`connect()` mounts a stateless MCP endpoint at `/mcp`, configurable through `MCP_API_PATH`. It requires an authenticated user with the `admin` role. See the [MCP reference](src/mcp/README.md) for its tools and resources.

MCP support is an optional peer dependency:

```bash
npm install @modelcontextprotocol/server
```

Without it, the engine boots and `/mcp` responds with `503`. Chat handlers configured through `connect(..., { chat })` additionally need `ai` and `@ai-sdk/mcp`, as well as `@modelcontextprotocol/server`: chat obtains tools through the engine's own MCP endpoint.

## Authentication and cookies

The API supports locally signed JWTs, configured OIDC providers, and API keys. Configure OIDC with `authConfig` in the third argument to `connect()`.

| Environment variable | Purpose | Default |
|----------------------|---------|---------|
| `UNCHAINED_TOKEN_SECRET` | Local JWT signing secret, at least 32 characters | Required for local tokens |
| `UNCHAINED_COOKIE_NAME` | Token cookie name | `unchained_token` |
| `UNCHAINED_COOKIE_PATH` | Cookie path | `/` |
| `UNCHAINED_COOKIE_DOMAIN` | Cookie domain | Unset |
| `UNCHAINED_COOKIE_SAMESITE` | SameSite attribute | `lax` |
| `UNCHAINED_COOKIE_INSECURE` | Any nonempty value disables the Secure attribute | Unset |

Cookies are `httpOnly` and `secure` by default. Account/token handling and ACL enforcement are implemented by the authentication middleware and resolvers; access to domain modules directly does not run those GraphQL permission checks.

## CORS and reverse proxies

Configure CORS through framework middleware or your reverse proxy. GraphQL Yoga also accepts its own `cors` server option through `startAPIServer()`/`startPlatform()`; it applies to GraphQL, not every mounted route.

For the authentication context to use proxy-provided client addresses, explicitly pass `trustProxy: true` to `connect()`:

```typescript
await connect(app, { graphqlHandler, unchainedAPI: unchainedCore }, {
  trustProxy: true,
});
```

The context resolver then prefers `X-Real-IP`, followed by the last address in `X-Forwarded-For`. Enable this only when a trusted reverse proxy overwrites those headers and direct access to the server is prevented. Framework-level proxy configuration is separate from this connector option.

The development-only `allowRemoteToLocalhostSecureCookies` connector option adds permissive CORS headers, overrides the forwarded protocol, and enables proxy address handling. It defaults to `false` and throws in production.

## Events

API authentication emits `API_LOGIN_TOKEN_CREATED`, `API_LOGIN_FAILED`, and `API_LOGOUT`. The API event registry also includes `ACL_DENIED` and `ACL_GRANTED_SENSITIVE` for access-control auditing; see [event definitions](src/events.ts).

See [SECURITY.md](../../SECURITY.md) for repository security information.

## License

EUPL-1.2
