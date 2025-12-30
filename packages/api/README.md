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
| `UnchainedContext` | GraphQL context type |
| `LocaleContext` | Locale-aware context type |

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
| `actions` | Available permission actions |

### Error Handling

| Export | Description |
|--------|-------------|
| `UnauthorizedError` | Authentication error |
| `PermissionDeniedError` | Authorization error |
| `InvalidIdError` | Invalid ID format error |
| `NotFoundError` | Resource not found error |

### Events

| Event | Description |
|-------|-------------|
| `API_REQUEST` | Emitted on API requests |

## Configuration

```typescript
const server = await startAPIServer({
  unchainedAPI: core,
  roles: customRoles,
  adminUiConfig: {
    basePath: '/admin',
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
- **Subscriptions**: Real-time updates (where supported)

## MCP Server

Model Context Protocol server for AI agent integrations:

```typescript
import { createMCPServer } from '@unchainedshop/api/mcp';

const mcpServer = createMCPServer(unchainedCore);
```

## Security

The API layer implements comprehensive security controls.

### Access Control

- **128+ permission actions** covering all API operations
- **Role-Based Access Control (RBAC)** with built-in and custom roles
- **ACL enforcement** on all GraphQL mutations
- **Ownership validation** ensuring users can only access their resources

### Session Security

| Variable | Purpose | Default |
|----------|---------|---------|
| `UNCHAINED_TOKEN_SECRET` | Session encryption (min 32 chars) | Required |
| `UNCHAINED_COOKIE_NAME` | Cookie name | `unchained_token` |
| `UNCHAINED_COOKIE_SAMESITE` | SameSite attribute | `none` |
| `UNCHAINED_COOKIE_INSECURE` | Disable secure flag | `false` |

Cookies are `httpOnly` and `secure` by default.

### Error Handling

Errors are designed to prevent information leakage:
- Generic authentication error messages
- No distinction between "invalid" vs "expired" tokens
- Permission errors don't reveal action details

### CORS Configuration

CORS behavior depends on `NODE_ENV`:

| Environment | Default Behavior |
|-------------|------------------|
| `development` | Permissive CORS (reflects any origin) + trust proxy headers |
| `production` | No CORS headers (reverse proxy should handle it) |

#### Environment Variable

| Variable | Purpose | Default |
|----------|---------|---------|
| `UNCHAINED_CORS_ORIGINS` | Allowed CORS origins | Auto (see above) |

#### Programmatic Configuration

```typescript
// Auto behavior (recommended) - permissive in dev, none in prod
connect(app, { graphqlHandler, db, unchainedAPI });

// Explicit whitelist (production)
connect(app, { graphqlHandler, db, unchainedAPI }, {
  corsOrigins: "https://shop.example.com,https://admin.example.com",
});

// Force permissive (not recommended in production)
connect(app, { graphqlHandler, db, unchainedAPI }, {
  corsOrigins: true,
});

// Disable CORS entirely
connect(app, { graphqlHandler, db, unchainedAPI }, {
  corsOrigins: false,
});
```

### Deployment Scenarios

#### Scenario 1: Direct TLS (No Reverse Proxy)

For simple deployments where the Node.js server handles TLS directly:

```typescript
import express from 'express';
import https from 'https';
import fs from 'fs';
import { connect } from '@unchainedshop/api/express';

const app = express();

// Configure CORS for your frontend origins
connect(app, { graphqlHandler, db, unchainedAPI }, {
  corsOrigins: "https://shop.example.com,https://admin.example.com",
});

// Create HTTPS server with your certificates
https.createServer({
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem'),
}, app).listen(443);
```

Environment:
```bash
NODE_ENV=production
UNCHAINED_CORS_ORIGINS=https://shop.example.com,https://admin.example.com
UNCHAINED_TOKEN_SECRET=your-32-char-secret-here
```

#### Scenario 2: Behind Reverse Proxy (Recommended)

For production deployments behind nginx, Caddy, or a cloud load balancer:

```typescript
import express from 'express';
import { connect } from '@unchainedshop/api/express';

const app = express();

// Trust the reverse proxy for client IP headers
app.set('trust proxy', 1);

// Let the proxy handle CORS, or configure here
connect(app, { graphqlHandler, db, unchainedAPI }, {
  corsOrigins: "https://shop.example.com,https://admin.example.com",
});

app.listen(4010); // Internal port, not exposed
```

**Nginx configuration:**
```nginx
server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  location / {
    # Pass client IP to the app
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;

    proxy_pass http://localhost:4010;
  }
}
```

**Caddy configuration:**
```caddyfile
api.example.com {
  reverse_proxy localhost:4010
}
```

#### Scenario 3: Proxy Handles CORS

For complex multi-origin setups, let the reverse proxy manage CORS:

```typescript
// Don't set corsOrigins - let proxy handle it
app.set('trust proxy', 1);
connect(app, { graphqlHandler, db, unchainedAPI });
```

**Nginx with CORS:**
```nginx
location / {
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  # CORS whitelist
  set $cors "";
  if ($http_origin ~* "^https://(shop|admin)\.example\.com$") {
    set $cors $http_origin;
  }
  add_header 'Access-Control-Allow-Origin' $cors always;
  add_header 'Access-Control-Allow-Credentials' 'true' always;
  add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
  add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

  if ($request_method = 'OPTIONS') { return 204; }

  proxy_pass http://localhost:4010;
}
```

### Trust Proxy

In development mode (`NODE_ENV=development`), trust proxy is automatically enabled.

In production, configure it on your Express/Fastify app before calling `connect()`:

```typescript
// Express
app.set('trust proxy', 1);  // Trust first hop
app.set('trust proxy', 'loopback');  // Trust loopback addresses
app.set('trust proxy', '10.0.0.0/8');  // Trust specific CIDR

// Fastify
const fastify = Fastify({ trustProxy: true });
```

**SECURITY**: Only enable trust proxy if your reverse proxy:
1. Strips incoming `X-Real-IP` and `X-Forwarded-For` headers from clients
2. Sets `X-Real-IP` to the actual client IP
3. Is the only way to reach your API server

See [SECURITY.md](../../SECURITY.md) for complete security documentation including FIPS 140-3 mode.

## License

EUPL-1.2
