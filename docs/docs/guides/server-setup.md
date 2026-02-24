---
sidebar_position: 11
title: Express vs Fastify Setup
sidebar_label: Server Setup
description: Choose and configure Express or Fastify as your HTTP server framework
---

# Server Setup

Unchained Engine supports both Express and Fastify as HTTP server frameworks. Both provide identical functionality through the `connect()` function from `@unchainedshop/api`.

## Quick Comparison

| Aspect | Express | Fastify |
|--------|---------|---------|
| Performance | Good | Better (2-3x faster) |
| Async Support | Callback-based | Native async/await |
| Plugin System | Middleware | Hooks and decorators |
| TypeScript | Good | Excellent |
| Ecosystem | Largest | Growing |
| Recommended | Teams familiar with Express | New projects |

## Fastify Setup (Recommended)

Fastify is the recommended choice for new projects. It's used by the default kitchensink example.

```typescript
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import defaultModules, { registerAllPlugins } from '@unchainedshop/plugins/presets/all.js';

registerAllPlugins();

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

const platform = await startPlatform({
  modules: defaultModules,
});

connect(fastify, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  adminUI: true,
});

await fastify.listen({
  host: '::',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
});
```

## Express Setup

```typescript
import express from 'express';
import http from 'node:http';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
import defaultModules, { registerAllPlugins } from '@unchainedshop/plugins/presets/all.js';

registerAllPlugins();

const app = express();
const httpServer = http.createServer(app);

const platform = await startPlatform({
  modules: defaultModules,
});

connect(app, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
});

await httpServer.listen({ port: process.env.PORT || 3000 });
```

## Connect Options

Both adapters accept the same options in the third argument:

```typescript
connect(server, platform, {
  // Allow secure cookies over HTTP in development (blocked in production)
  allowRemoteToLocalhostSecureCookies: boolean,

  // Enable the Admin UI at the root path or configure with prefix
  adminUI: boolean | { prefix: string },

  // AI chat configuration (requires OpenAI-compatible provider)
  chat: { model: ChatModel, imageGeneration?: ImageModel },

  // OIDC/OAuth authentication configuration
  authConfig: AuthConfig,

  // Trust X-Forwarded-* headers from reverse proxy
  trustProxy: boolean,
});
```

## Key Differences

### HTTP Server Creation

Express requires manually creating an HTTP server, while Fastify handles it internally:

```typescript
// Express - manual HTTP server
const app = express();
const httpServer = http.createServer(app);
await httpServer.listen({ port: 3000 });

// Fastify - built-in server
const fastify = Fastify({ trustProxy: true });
await fastify.listen({ host: '::', port: 3000 });
```

### Logger Integration

```typescript
// Express - use createLogger from @unchainedshop/logger
import { createLogger } from '@unchainedshop/logger';
const logger = createLogger('app');

// Fastify - use unchainedLogger wrapper
import { unchainedLogger } from '@unchainedshop/api/fastify';
const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
});
```

### Adding Custom Middleware

```typescript
// Express - standard middleware
app.use('/api/custom', (req, res) => {
  res.json({ hello: 'world' });
});

// Fastify - route registration
fastify.route({
  method: 'GET',
  url: '/api/custom',
  handler: async (request, reply) => {
    return { hello: 'world' };
  },
});
```

## Admin UI

Both adapters support serving the Admin UI. Enable it via the `adminUI` option:

```typescript
// Enable at root path
connect(server, platform, { adminUI: true });

// Enable with custom prefix
connect(server, platform, { adminUI: { prefix: '/admin' } });
```

## OIDC Authentication

For enterprise authentication with external identity providers, pass the `authConfig` option. See the [OIDC example](https://github.com/unchainedshop/unchained/tree/master/examples/oidc) for a complete implementation.

## Related

- [Quick Start](../quick-start/index.md) - Get started with Unchained Engine
- [Environment Variables](../platform-configuration/environment-variables.md) - Configuration options
- [Deployment](../deployment/docker.md) - Deploy to production
