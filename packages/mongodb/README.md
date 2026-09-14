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

// Connect using MONGO_URL, or start a local MongoDB through mongodb-memory-server.
process.env.MONGO_URL = 'mongodb://localhost:27017/unchained';
const db = await initDb();

// Generate a new string ID
const id = generateDbObjectId();

// Stop the database when shutting down
await stopDb();
```

## API Overview

### Database Lifecycle

| Export | Description |
|--------|-------------|
| `createDatabaseResource` | Connect with automatic cleanup via `await using` |
| `initDb` | Connect using MONGO_URL or a managed local MongoDB instance |
| `startDb` | Start a managed local MongoDB instance and return its URL |
| `stopDb` | Close the database connection |

### Query Utilities

| Export | Description |
|--------|-------------|
| `generateDbObjectId` | Generate a random 24-digit hexadecimal string ID |
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

## Best Practices

### Collection Naming Conventions

Unchained uses the following collection naming patterns:

| Pattern | Example | Usage |
|---------|---------|-------|
| Plural lowercase | `products`, `orders`, `users` | Main entity collections |
| Underscore-separated | `product_texts`, `product_media` | Related sub-collections |

**Note:** Provider collections use hyphens (`payment-providers`, `delivery-providers`, `warehousing-providers`), and the assortment cache is `assortment_productId_cache`. Follow the existing collection names when querying or migrating data.

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
const deletedIndex = { index: { deleted: 1 } };
```

Queries should filter by `deleted: null` to exclude soft-deleted documents.

#### Sparse Indexes

Use sparse indexes when the indexed field is absent from most documents. Documents with an explicit `null` value are still indexed:

```typescript
const sparseIndex = {
  index: { optionalField: 1 },
  options: { sparse: true },
};
```

Sparse indexes are smaller and more efficient when the field is rarely present.

#### Text Indexes

For full-text search, create compound text indexes:

```typescript
const textIndex = {
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
};
```

The built-in search relies on MongoDB text indexes and `$text` queries. Verify these operations against your chosen MongoDB-compatible backend before deploying; index creation and query compatibility are separate requirements.

## License

EUPL-1.2
