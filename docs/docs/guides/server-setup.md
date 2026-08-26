---
sidebar_position: 11
title: Express vs Fastify Setup
sidebar_label: Server Setup
description: Choose and configure Express or Fastify as your HTTP server framework
---

# Server Setup

Unchained Engine supports both Express and Fastify as HTTP server frameworks, with identical functionality through the `connect()` function from `@unchainedshop/api/express` or `@unchainedshop/api/fastify`. Fastify is used by the default [kitchensink example](https://github.com/unchainedshop/unchained/tree/master/examples/kitchensink) and recommended for new projects; the [kitchensink-express example](https://github.com/unchainedshop/unchained/tree/master/examples/kitchensink-express) shows the Express equivalent.

## Fastify Setup (Recommended)

```typescript
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';

registerAllPlugins();

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

const platform = await startPlatform({});

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
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';

registerAllPlugins();

const app = express();
const httpServer = http.createServer(app);

const platform = await startPlatform({});

connect(app, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  adminUI: true,
});

await httpServer.listen({ port: process.env.PORT || 3000 });
```

:::note
Import the preset without a file extension (`@unchainedshop/plugins/presets/all`) — the package exports map appends `.js` itself. `startPlatform({})` needs no `modules` argument for the built-in core modules.
:::

## Connect Options

Both adapters accept the same options in the third argument:

```typescript
connect(server, platform, {
  // Allow secure cookies over HTTP for development;
  // connect() throws if this is enabled with NODE_ENV=production
  allowRemoteToLocalhostSecureCookies: boolean,

  // Serve the Admin UI: true, or an options object
  adminUI: boolean | { prefix?: string; theme?: AdminUIThemeConfig; plugins?: AdminUIPluginConfig[] },

  // AI chat endpoint (Vercel AI SDK model instances)
  chat: { model: LanguageModel; imageGenerationTool?: { model: ImageModel; uploadUrl?: string } },

  // OIDC/OAuth authentication configuration
  authConfig: AuthConfig,

  // Trust X-Forwarded-For / X-Real-IP headers from a reverse proxy
  // (implied automatically when allowRemoteToLocalhostSecureCookies is set)
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

### Adding Custom Routes

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

Enable the Admin UI via the `adminUI` option:

```typescript
// Serve at the root path
connect(server, platform, { adminUI: true });

// Serve under a prefix
connect(server, platform, { adminUI: { prefix: '/admin' } });
```

The options object also accepts `theme` (design token overrides) and `plugins` (custom Admin UI extensions) — see the kitchensink examples for a full configuration.

## OIDC Authentication

For authentication with external identity providers, pass the `authConfig` option. See the [OIDC example](https://github.com/unchainedshop/unchained/tree/master/examples/oidc) for a complete implementation.

## Related

- [Quick Start](../quick-start/index.md) - Get started with Unchained Engine
- [Environment Variables](../platform-configuration/environment-variables.md) - Configuration options
- [Deployment](../deployment/docker.md) - Deploy to production
