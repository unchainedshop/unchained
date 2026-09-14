[![npm version](https://img.shields.io/npm/v/@unchainedshop/mongodb.svg)](https://npmjs.com/package/@unchainedshop/mongodb)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/mongodb

MongoDB database abstraction layer for the Unchained Engine.

## Installation

```bash
npm install @unchainedshop/mongodb
```

## Usage

```typescript
import { initDb, stopDb, generateDbObjectId } from '@unchainedshop/mongodb';

// Connect to MONGO_URL, or start a local MongoDB instance when it is unset
const db = await initDb();

// Generate a random hexadecimal string ID (24 characters by default)
const id = generateDbObjectId();

// Stop the database when shutting down
await stopDb();
```

## API Overview

### Database Lifecycle

| Export | Description |
|--------|-------------|
| `initDb` | Connect using `MONGO_URL`, or start and connect to local MongoDB |
| `startDb` | Start a local MongoDB server and return its connection URL |
| `stopDb` | Close the database connection |
| `createDatabaseResource` | Create an async-disposable database resource |

### Query Utilities

| Export | Description |
|--------|-------------|
| `generateDbObjectId` | Generate a random hexadecimal string ID |
| `generateDbFilterById` | Create a filter object for querying by ID |
| `buildDbIndexes` | Create indexes for a collection |
| `findPreservingIds` | Find documents while preserving ID order |
| `buildSortOptions` | Build MongoDB sort options from SortOption array |
| `findLocalizedText` | Find localized text by locale with fallback |
| `insensitiveTrimmedRegexOperator` | Create case-insensitive trimmed regex for text search |

### Re-exports

| Export | Description |
|--------|-------------|
| `mongodb` | Re-exported mongodb driver for direct access |

### Types

| Export | Description |
|--------|-------------|
| `LogFields` | Interface for document log entries |
| `TimestampFields` | Interface for created/updated/deleted timestamps |
| `Address` | Interface for postal address data |
| `Contact` | Interface for contact information |
| `Migration` | Interface for database migrations |
| `MigrationRepository` | Interface for managing migrations |
| `ModuleInput` | Interface for core module initialization input |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGO_URL` | External MongoDB connection URL; when unset, start local MongoDB |
| `PORT` | Local MongoDB defaults to this port plus one (`4011` if unset) |
| `NODE_ENV` | `test` selects ephemeral storage for local MongoDB |

`initDb()`, `startDb()`, and `createDatabaseResource()` accept `{ forceInMemory, port }`. Local non-test data is stored in `.db` under the current working directory; `stopDb()` preserves those persistent files.

## Best Practices

### Collection Naming Conventions

Unchained uses the following collection naming patterns:

| Pattern | Example | Usage |
|---------|---------|-------|
| Plural lowercase | `products`, `orders`, `users` | Main entity collections |
| Underscore-separated | `product_texts`, `product_media` | Related sub-collections |

**Note:** Some legacy collections may use different patterns. When creating new collections, prefer the underscore-separated pattern for sub-collections.

### Index Guidelines

#### Using `buildDbIndexes`

Always use the `buildDbIndexes` helper to create indexes:

```typescript
import { buildDbIndexes } from '@unchainedshop/mongodb';

await buildDbIndexes<Product>(Products, [
  { index: { deleted: 1 } },           // Soft delete support
  { index: { status: 1 } },            // Query by status
  { index: { slugs: 1 } },             // URL slug lookups
  { index: { tags: 1 } },              // Tag filtering
]);
```

#### Soft Delete Pattern

Collections using soft delete should always include a `deleted` index:

```typescript
{ index: { deleted: 1 } }
```

Queries should filter by `deleted: null` to exclude soft-deleted documents.

#### Sparse Indexes

Use sparse indexes when the indexed field is absent from most documents:

```typescript
{
  index: { optionalField: 1 },
  options: { sparse: true }
}
```

Sparse indexes are smaller and more efficient when the field is rarely present.

#### Text Indexes

For full-text search, create compound text indexes:

```typescript
{
  index: {
    _id: 'text',
    name: 'text',
    description: 'text',
  } as any,
  options: {
    weights: {
      _id: 10,
      name: 5,
      description: 1,
    },
    name: 'fulltext_search',
  },
}
```

`buildDbIndexes()` attempts the indexes supplied by each collection, including any text indexes. It does not detect database vendors or versions. Check your database's support for the index definitions used by your modules.

## License

EUPL-1.2
