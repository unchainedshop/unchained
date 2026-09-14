[![npm version](https://img.shields.io/npm/v/@unchainedshop/api.svg)](https://npmjs.com/package/@unchainedshop/api)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/api

GraphQL API layer for the Unchained Engine. Provides a complete GraphQL API using Yoga with support for Express and Fastify servers, plus MCP (Model Context Protocol) server for AI integrations.

## Installation

```bash
npm install @unchainedshop/api
```

## Usage

```typescript
import express from 'express';
import { startAPIServer } from '@unchainedshop/api';
import { connect } from '@unchainedshop/api/express';

const app = express();

// Start API server (returns GraphQL Yoga server instance)
const graphqlHandler = await startAPIServer({
  unchainedAPI: unchainedCore,
  adminUiConfig: {
    // Admin UI configuration
  },
});

// Connect Express app with Unchained API
connect(app, { graphqlHandler, db, unchainedAPI: unchainedCore }, {
  adminUI: true, // Enable admin UI
});

app.listen(4010);
```

### With Fastify

```typescript
import Fastify from 'fastify';
import { connect } from '@unchainedshop/api/fastify';

const fastify = Fastify();
await connect(fastify, { graphqlHandler, db, unchainedAPI: unchainedCore });
await fastify.listen({ port: 4010 });
```

## API Overview

### Server Setup

| Export | Description |
|--------|-------------|
| `startAPIServer` | Create GraphQL server with full schema |
| `createContextResolver` | Create request context resolver |
| `getCurrentContextResolver` | Get current context resolver |
| `setCurrentContextResolver` | Set custom context resolver |

### Server Adapters

| Import Path | Export | Description |
|-------------|--------|-------------|
| `@unchainedshop/api/express` | `connect` | Connect Express app with Unchained API |
| `@unchainedshop/api/express` | `adminUIRouter` | Admin UI Express router |
| `@unchainedshop/api/fastify` | `connect` | Connect Fastify app with Unchained API |

### Context

| Export | Description |
|--------|-------------|
| `Context` | GraphQL context type |
| `UnchainedLocaleContext` | Locale-aware context type |

### Loaders

Data loaders for efficient batched queries:

| Loader | Description |
|--------|-------------|
| `productLoader` | Batch product loading |
| `assortmentLoader` | Batch assortment loading |
| `userLoader` | Batch user loading |

### Access Control

| Export | Description |
|--------|-------------|
| `acl` | Access control list utilities |
| `roles` | Role definitions and actions |
| `roles.actions` | Available permission actions |

### Error Handling

| Export | Description |
|--------|-------------|
| `NoPermissionError` | Authorization error |
| `InvalidIdError` | Invalid ID format error |
| `ProductNotFoundError` | Product not found error |

### Events

| Event | Description |
|-------|-------------|
| `API_LOGIN_TOKEN_CREATED` | Session token created |
| `API_LOGOUT` | User logged out |

## Configuration

```typescript
const server = await startAPIServer({
  unchainedAPI: core,
  roles: customRoles,
  adminUiConfig: {
    defaultProductTags: ['featured'],
  },
  context: (defaultResolver) => async (props, req, res) => {
    const context = await defaultResolver(props, req, res);
    return {
      ...context,
      // Add custom context
    };
  },
  typeDefs: [
    // Additional GraphQL type definitions
  ],
  resolvers: [
    // Additional resolvers
  ],
});
```

## GraphQL Schema

The API exposes a complete GraphQL schema with:

- **Queries**: Products, orders, users, assortments, filters, etc.
- **Mutations**: CRUD operations, checkout, authentication

## MCP Server

Model Context Protocol server for AI agent integrations. `connect()` (Express or Fastify) automatically mounts a stateless MCP endpoint at `/mcp` (configurable via `MCP_API_PATH`). The endpoint requires an authenticated user with the `admin` role and serves 9 management tools plus the shop localization resources.

MCP support is an optional peer dependency:

```bash
npm install @modelcontextprotocol/server
```

Without it, the engine boots normally and authenticated admin requests to `/mcp` receive `503`; authentication and role checks still run first. The chat handlers (`connect(..., { chat })`) additionally require the optional peers `ai` and `@ai-sdk/mcp` — and `@modelcontextprotocol/server` too, since chat derives its tool set through the engine's own `/mcp` endpoint.

## Security

The API layer implements comprehensive security controls.

### Access Control

- **Permission actions** covering all API operations
- **Role-Based Access Control (RBAC)** with built-in and custom roles
- **ACL enforcement** on all GraphQL mutations
- **Ownership validation** ensuring users can only access their resources

### Session Security

| Variable | Purpose | Default |
|----------|---------|---------|
| `UNCHAINED_TOKEN_SECRET` | Session signing secret (min 32 chars) | Required |
| `UNCHAINED_COOKIE_NAME` | Cookie name | `unchained_token` |
| `UNCHAINED_COOKIE_SAMESITE` | SameSite attribute | `none` |
| `UNCHAINED_COOKIE_INSECURE` | Any nonempty value disables the secure flag | Unset |

Cookies are `httpOnly` and `secure` by default.

### Error Handling

Errors are designed to prevent information leakage:
- Generic authentication error messages
- No distinction between "invalid" vs "expired" tokens
- Permission errors don't reveal action details

### CORS and Trust Proxy

`connect()` does not configure general CORS handling or infer trust settings from `NODE_ENV`. Configure CORS with your HTTP framework or reverse proxy. GraphQL Yoga also has its own CORS options, passed to `startAPIServer`.

For a local development server accessed from a remote frontend, both adapters provide an explicit compatibility option:

```typescript
connect(app, { graphqlHandler, db, unchainedAPI }, {
  allowRemoteToLocalhostSecureCookies: true,
});
```

This reflects the request origin, allows credentials, and overrides `x-forwarded-proto` to `https`. The Express adapter also enables trust for one proxy hop. Use this option only for that development setup.

Configure production proxy trust on the application according to your proxy topology:

```typescript
// Express, when the application is reachable only through one trusted proxy
app.set('trust proxy', 1);
connect(app, { graphqlHandler, db, unchainedAPI });

// Fastify: configure trust when creating the instance
const fastify = Fastify({ trustProxy: '127.0.0.1' });
```

See [SECURITY.md](../../SECURITY.md) for session storage, proxy, and cryptography details.

## License

EUPL-1.2
