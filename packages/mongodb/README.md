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
import { initDb, startDb, stopDb, generateDbObjectId } from '@unchainedshop/mongodb';

// Initialize the database connection
const db = await initDb({
  connectionString: 'mongodb://localhost:27017/unchained',
});

// Start the database
await startDb(db);

// Generate a new ObjectId
const id = generateDbObjectId();

// Stop the database when shutting down
await stopDb(db);
```

## API Overview

### Database Lifecycle

| Export | Description |
|--------|-------------|
| `initDb` | Initialize MongoDB connection with connection string |
| `startDb` | Start the database connection |
| `stopDb` | Close the database connection |

### Query Utilities

| Export | Description |
|--------|-------------|
| `generateDbObjectId` | Generate a new MongoDB ObjectId |
| `generateDbFilterById` | Create a filter object for querying by ID |
| `buildDbIndexes` | Create indexes for a collection |
| `findPreservingIds` | Find documents while preserving ID order |
| `buildSortOptions` | Build MongoDB sort options from SortOption array |
| `findLocalizedText` | Find localized text by locale with fallback |
| `insensitiveTrimmedRegexOperator` | Create case-insensitive trimmed regex for text search |

### DocumentDB Compatibility

| Export | Description |
|--------|-------------|
| `isDocumentDBCompatModeEnabled` | Check if AWS DocumentDB compatibility mode is enabled |
| `assertDocumentDBCompatMode` | Throw error if DocumentDB compat mode is enabled (for unsupported operations) |

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

| Variable | Description |
|----------|-------------|
| `UNCHAINED_DOCUMENTDB_COMPAT_MODE` | Enable AWS DocumentDB compatibility mode |

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

Use sparse indexes when the indexed field may be null/undefined for most documents:

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

**Important:** Text indexes are not supported in DocumentDB compatibility mode. Use `isDocumentDBCompatModeEnabled()` to conditionally create them.

### DocumentDB Compatibility

When running on AWS DocumentDB, some MongoDB features are not supported:

| Feature | Alternative |
|---------|-------------|
| Text indexes | Use application-level search or external search service |
| `$text` queries | Use regex queries (less performant) |
| Some aggregation operators | Check DocumentDB documentation |

Use the compatibility helpers:

```typescript
import { isDocumentDBCompatModeEnabled, assertDocumentDBCompatMode } from '@unchainedshop/mongodb';

// Check before using unsupported features
if (!isDocumentDBCompatModeEnabled()) {
  // Create text index
}

// Throw error if DocumentDB mode is enabled
assertDocumentDBCompatMode(); // Throws if in compat mode
```

## License

EUPL-1.2
