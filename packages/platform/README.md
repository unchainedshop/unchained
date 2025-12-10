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
import express from 'express';

const app = express();

const { unchainedAPI, graphqlHandler } = await startPlatform({
  express: app,
  options: {
    // Platform options
  },
});

// Platform is ready
app.listen(4010);
```

## API Overview

### Platform Setup

| Export | Description |
|--------|-------------|
| `startPlatform` | Initialize complete Unchained platform |
| `runMigrations` | Run database migrations |
| `printRuntimeConfiguration` | Log registered templates, events, and adapters |

### Context Helpers

| Export | Description |
|--------|-------------|
| `setAccessToken` | Set access token for user session |
| `getAccessToken` | Get current access token |
| `invalidateAccessToken` | Invalidate/logout access token |

### Templates

| Export | Description |
|--------|-------------|
| `MessageTypes` | Available message/notification types |
| `setupTemplates` | Register message templates |

### Message Types

| Type | Description |
|------|-------------|
| `ACCOUNT_ACTION` | Account verification, password reset |
| `DELIVERY` | Delivery notifications |
| `ORDER_CONFIRMATION` | Order confirmation emails |
| `ORDER_REJECTION` | Order rejection notifications |
| `QUOTATION_STATUS` | Quotation status updates |
| `ENROLLMENT_STATUS` | Subscription status updates |
| `FORWARD_DELIVERY` | Forward delivery notifications |

## Quick Start

```typescript
import express from 'express';
import { startPlatform, MessageTypes } from '@unchainedshop/platform';

const app = express();

const { unchainedAPI, graphqlHandler } = await startPlatform({
  express: app,
  options: {
    modules: {
      // Module-specific configuration
    },
    plugins: [
      // Plugin imports
    ],
  },
  workQueueConfig: {
    // Worker queue configuration
  },
});

// Access unchained API
const products = await unchainedAPI.modules.products.findProducts({});

// Start server
app.use('/graphql', graphqlHandler);
app.listen(4010);
```

## Configuration

```typescript
const platform = await startPlatform({
  express: app,
  options: {
    modules: {
      orders: {
        // Order module options
      },
      products: {
        // Product module options
      },
    },
    services: {
      // Custom services
    },
    bulkImporter: {
      handlers: {
        // Custom import handlers
      },
    },
  },
  workQueueConfig: {
    batchSize: 10,
    pollInterval: 1000,
  },
  context: (defaultResolver) => async (props, req, res) => {
    const context = await defaultResolver(props, req, res);
    return {
      ...context,
      // Custom context properties
    };
  },
});
```

## Returns

The `startPlatform` function returns:

| Property | Description |
|----------|-------------|
| `unchainedAPI` | Complete Unchained core API instance |
| `graphqlHandler` | GraphQL Yoga server instance for Express/Fastify |
| `db` | MongoDB database instance |

## License

EUPL-1.2
