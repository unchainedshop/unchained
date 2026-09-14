[![npm version](https://img.shields.io/npm/v/@unchainedshop/platform.svg)](https://npmjs.com/package/@unchainedshop/platform)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/platform

Umbrella package for the Unchained Engine. Initializes the database, core modules and services, plugins, GraphQL server, message templates, and work queue.

## Installation

```bash
npm install @unchainedshop/platform express
```

## Quick start

Register plugins, initialize the platform, and connect it to your HTTP server:

```typescript
import express from 'express';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';

registerBasePlugins();

const app = express();
const platform = await startPlatform({});
await connect(app, platform);

const products = await platform.unchainedAPI.modules.products.findProducts({});
app.listen(4010);
```

For Fastify, use `connect` from `@unchainedshop/api/fastify` with a Fastify instance. `connect()` mounts GraphQL, MCP, and registered plugin routes. Pass `{ adminUI: true }` as its third argument to serve an installed `@unchainedshop/admin-ui` package.

Before startup, set `ROOT_URL`, `EMAIL_WEBSITE_NAME`, `EMAIL_WEBSITE_URL`, `EMAIL_FROM`, and `UNCHAINED_TOKEN_SECRET` (at least 32 characters). Set `MONGO_URL` for an external MongoDB; otherwise the database package starts a local instance.

## Configuration

```typescript
const platform = await startPlatform({
  options: {
    orders: {
      // Order module settings
    },
    products: {
      // Product module settings
    },
  },
  modules: {
    // Custom modules with a configure({ db, migrationRepository, options }) function
  },
  services: {
    // Custom services
  },
  bulkImporter: {
    handlers: {
      // Custom import handlers
    },
  },
  workQueueOptions: {
    skipInvalidationOnStartup: true,
  },
  context: (defaultResolver) => async (props, req, res) => ({
    ...(await defaultResolver(props, req, res)),
    // Additional request context
  }),
});
```

`PlatformOptions` combines core configuration with GraphQL server options, `rolesOptions`, `workQueueOptions`, and `auditLog`. Built-in modules are included automatically. Module settings are direct properties of `options`; module/service overrides and import/export handlers are top-level options.

The work queue runs migrations and starts queue managers during startup unless workers are disabled. See [work queue options](src/setup/setupWorkqueue.ts) and [platform initialization](src/startPlatform.ts) for the current options.

## Exports

| Export | Description |
|--------|-------------|
| `startPlatform` | Initialize the platform |
| `PlatformOptions` | Platform configuration type |
| `runMigrations` | Run registered database migrations |
| `printRuntimeConfiguration` | Log registered templates, events, and adapters |
| `MessageTypes` | Built-in message type constants |

The package also exports the [built-in template resolvers](src/templates/index.ts). Platform startup registers them automatically; custom templates use `MessagingDirector.registerTemplate()` from `@unchainedshop/core`.

| Message type | Purpose |
|--------------|---------|
| `ACCOUNT_ACTION` | Email verification and password reset |
| `DELIVERY` | Forward delivery notifications |
| `ORDER_CONFIRMATION` | Order confirmations |
| `ORDER_REJECTION` | Order rejections |
| `QUOTATION_STATUS` | Quotation status updates |
| `ENROLLMENT_STATUS` | Enrollment status updates |
| `ERROR_REPORT` | Error reports |

## Return value

| Property | Description |
|----------|-------------|
| `unchainedAPI` | Core modules, services, bulk importer/exporter, and options |
| `graphqlHandler` | GraphQL Yoga server instance |
| `db` | MongoDB database instance |

## License

EUPL-1.2
