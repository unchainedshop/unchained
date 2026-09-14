[![npm version](https://img.shields.io/npm/v/@unchainedshop/platform.svg)](https://npmjs.com/package/@unchainedshop/platform)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/platform

Umbrella package for the Unchained Engine. Provides complete platform setup including database initialization, API server, migrations, templates, and runtime configuration.

## Installation

```bash
npm install @unchainedshop/platform
```

## Usage

```typescript
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
import express from 'express';

const app = express();

const engine = await startPlatform({
  options: {
    // Platform options
  },
});

// Mount GraphQL, sessions, uploads, and optional integrations
connect(app, engine);
app.listen(4010);
```

## API Overview

### Platform Setup

| Export | Description |
|--------|-------------|
| `startPlatform` | Initialize complete Unchained platform |
| `runMigrations` | Run database migrations |
| `printRuntimeConfiguration` | Log registered templates, events, and adapters |

### Templates

| Export | Description |
|--------|-------------|
| `MessageTypes` | Available message/notification types |

### Message Types

| Type | Description |
|------|-------------|
| `ACCOUNT_ACTION` | Account verification, password reset |
| `DELIVERY` | Delivery notifications |
| `ORDER_CONFIRMATION` | Order confirmation emails |
| `ORDER_REJECTION` | Order rejection notifications |
| `QUOTATION_STATUS` | Quotation status updates |
| `ENROLLMENT_STATUS` | Subscription status updates |
| `ERROR_REPORT` | Worker error reports |

## Configuration

Set `EMAIL_WEBSITE_NAME`, `EMAIL_WEBSITE_URL`, `EMAIL_FROM`, `ROOT_URL`, and `UNCHAINED_TOKEN_SECRET` before starting. The token secret must contain at least 32 characters. Set `MONGO_URL` to use an external MongoDB instance.

Module options are keyed directly by module name under `options`. Custom module/service implementations and bulk import handlers are top-level properties. Import plugins before starting the platform.

```typescript
import { schedule } from '@unchainedshop/core';
import '@unchainedshop/plugins/worker/email.js';

const engine = await startPlatform({
  options: {
    orders: {
      // Order module settings
    },
    products: {
      // Product module settings
    },
  },
  modules: {
    // Custom module factories
  },
  services: {
    // Custom service functions
  },
  bulkImporter: {
    handlers: {
      // Custom import handlers
    },
  },
  workQueueOptions: {
    batchCount: 10,
    schedule: schedule.parse.text('every 2 seconds'),
  },
  context: (defaultResolver) => async (props, req, res) => {
    const context = await defaultResolver(props, req, res);
    return {
      ...context,
      // Custom context properties
    };
  },
});

connect(app, engine, { adminUI: true });
const products = await engine.unchainedAPI.modules.products.findProducts({});
```

`startPlatform` initializes the core and GraphQL handler; call the Express or Fastify `connect` adapter to mount HTTP routes. Queue managers and migrations start during setup unless the worker is disabled. Process signal and error handlers stop the queue, dispose the GraphQL handler, and close the database during shutdown.

## Returns

The `startPlatform` function returns:

| Property | Description |
|----------|-------------|
| `unchainedAPI` | Complete Unchained core API instance |
| `graphqlHandler` | GraphQL Yoga server instance for Express/Fastify |
| `db` | MongoDB database instance |

## License

EUPL-1.2
