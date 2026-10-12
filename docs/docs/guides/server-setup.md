---
sidebar_position: 11
title: Express vs Fastify Setup
sidebar_label: Server Setup
description: Choose and configure Express or Fastify as your HTTP server framework
---

# Server Setup

Unchained Engine supports Express, Fastify and plain Node.js, with identical functionality through the `connect()` function from `@unchainedshop/api/express`, `@unchainedshop/api/fastify` or `@unchainedshop/api/node`. All three serve the same endpoints: GraphQL, MCP, the AI chat, plugin routes and the Admin UI, with Express and Fastify as routes of your app, so its middleware and hooks apply to them. Fastify is used by the default [kitchensink example](https://github.com/unchainedshop/unchained/tree/master/examples/kitchensink) and recommended for new projects; the [kitchensink-express example](https://github.com/unchainedshop/unchained/tree/master/examples/kitchensink-express) shows the Express equivalent.

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

await connect(fastify, platform, {
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

await connect(app, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  adminUI: true,
});

await httpServer.listen({ port: process.env.PORT || 3000 });
```

:::note
Import the preset without a file extension (`@unchainedshop/plugins/presets/all`) — the package exports map appends `.js` itself. `startPlatform({})` needs no `modules` argument for the built-in core modules.
:::

## Plain Node.js and Other Runtimes

Without a framework, `connect()` from `@unchainedshop/api/node` serves the engine from a `node:http` server and answers other requests with `404`:

```typescript
import { createServer } from 'node:http';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/node';

const platform = await startPlatform({});
const server = createServer();
await connect(server, platform, { adminUI: true });
server.listen(process.env.PORT || 3000);
```

Runtimes that serve WHATWG `Request` / `Response` objects (Bun, Deno) use the fetch handler directly. It answers `undefined` for requests that are not the engine's:

```typescript
import { createFetchHandler } from '@unchainedshop/api/fetch';

const handler = createFetchHandler(platform, { adminUI: true });
Bun.serve({
  fetch: async (request, server) =>
    (await handler(request, { remoteAddress: server.requestIP(request)?.address })) ??
    new Response('Not Found', { status: 404 }),
});
```

## Connect Options

All adapters accept the same options in the third argument:

```typescript
await connect(server, platform, {
  // Allow secure cookies over HTTP for development;
  // connect() throws if this is enabled with NODE_ENV=production
  allowRemoteToLocalhostSecureCookies: boolean,

  // Serve the Admin UI: true, or an options object
  adminUI: boolean | { prefix?: string; theme?: AdminUIThemeConfig; plugins?: AdminUIPluginConfig[] },

  // AI chat endpoint (Vercel AI SDK model instances)
  chat: {
    model: LanguageModel;
    imageGenerationTool?: { model: ImageModel; uploadUrl?: string };
    // Origins of an Admin UI served from elsewhere, e.g. ['https://admin.example.com']
    allowedOrigins?: string[];
  },

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

Your routes get the request context of the engine (user, locale, `login` / `logout`, modules and services) as `req.unchainedContext` (Express: routes registered after `connect()`) or `request.unchainedContext` (Fastify), and run as its user, so the events they emit carry it in the audit log. Fastify routes with `config: { unchainedContext: false }`, such as health checks, skip it. `connect()` does not register a cookie plugin: add `cookie-parser` or `@fastify/cookie` yourself if your routes read cookies.

The engine's endpoints are routes of your app. With Express, the middleware you add before `connect()` runs for them (helmet, CORS, rate limiting, body parsers). With Fastify, the hooks of the instance run for them, and so do the hooks that plugins registered before `connect()` add to every route, like those of `@fastify/rate-limit`. GraphQL takes its body from Fastify's parsers, within `bodyLimit` and with `415` for other content types; with Express, from your body parser or GraphQL Yoga, up to its `maxRequestBodySize` (25 MB by default, an option of `startPlatform()`). MCP, the chat and plugin routes read the body as sent, MCP and chat up to 10 MB. With Fastify, routes of your app take precedence over the Admin UI, a `GET` route below its prefix (`/*` without one, which conflicts with a `GET /*` route of your own) that leaves files it does not have to your not-found handler. With Express, the routes you add after `connect()` come after the Admin UI.

## Admin UI

Enable the Admin UI via the `adminUI` option:

```typescript
// Serve at the root path
await connect(server, platform, { adminUI: true });

// Serve under a prefix
await connect(server, platform, { adminUI: { prefix: '/admin' } });
```

The options object also accepts `theme` (design token overrides) and `plugins` (custom Admin UI extensions) — see the kitchensink examples for a full configuration.

## OIDC Authentication

For authentication with external identity providers, pass the `authConfig` option. See the [OIDC example](https://github.com/unchainedshop/unchained/tree/master/examples/oidc) for a complete implementation.

## Related

- [Quick Start](../quick-start/index.md) - Get started with Unchained Engine
- [Environment Variables](../platform-configuration/environment-variables.md) - Configuration options
- [Deployment](../deployment/docker.md) - Deploy to production
