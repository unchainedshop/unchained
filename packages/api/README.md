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

## License

EUPL-1.2
