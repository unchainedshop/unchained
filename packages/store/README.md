[![npm version](https://img.shields.io/npm/v/@unchainedshop/store.svg)](https://npmjs.com/package/@unchainedshop/store)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/store

Drizzle ORM storage layer for the Unchained Engine. Provides database connection utilities and helpers for SQLite/Turso-based modules.

## Installation

```bash
npm install @unchainedshop/store
```

## Overview

This package provides the core database abstraction layer for Unchained Engine v5+, replacing the previous MongoDB-based `@unchainedshop/mongodb` package. It uses [Drizzle ORM](https://orm.drizzle.team/) with [libSQL](https://libsql.org/) (SQLite/Turso) as the database backend.

### Key Features

- **SQLite/Turso Support**: Use SQLite locally or Turso for cloud deployments
- **Type-Safe Queries**: Full TypeScript support with Drizzle ORM
- **FTS5 Full-Text Search**: Built-in helpers for SQLite FTS5 virtual tables
- **In-Memory Testing**: Create isolated test databases instantly
- **ObjectId-Compatible IDs**: Generate 24-character hex IDs compatible with MongoDB ObjectIds

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DRIZZLE_DB_URL` | `file:unchained.db` | Database connection URL |
| `DRIZZLE_DB_TOKEN` | - | Turso authentication token (for cloud databases) |

### Connection URL Formats

```bash
# Local SQLite file
DRIZZLE_DB_URL=file:unchained.db

# In-memory database (for testing)
DRIZZLE_DB_URL=file::memory:

# Turso cloud database
DRIZZLE_DB_URL=libsql://your-db.turso.io
DRIZZLE_DB_TOKEN=your-auth-token
```

## Usage

### Creating a Database Connection

```typescript
import { createDrizzleDb, type DrizzleDbConnection } from '@unchainedshop/store';

// Create connection from environment variables
const connection = createDrizzleDb({
  url: process.env.DRIZZLE_DB_URL || 'file:unchained.db',
  authToken: process.env.DRIZZLE_DB_TOKEN,
});

// Use the database
const { db } = connection;

// Clean up when done
connection.close();
```

### Creating a Test Database

```typescript
import { createTestDb } from '@unchainedshop/store';

// Create an in-memory database for testing
const { db, close } = createTestDb();

// Run tests...

// Clean up
close();
```

### Initializing Module Schemas

```typescript
import { initializeDrizzleDb, type DrizzleDb } from '@unchainedshop/store';
import { initializeCountriesSchema } from '@unchainedshop/core-countries';
import { initializeUsersSchema } from '@unchainedshop/core-users';

// Initialize all schemas
await initializeDrizzleDb(db, [
  initializeCountriesSchema,
  initializeUsersSchema,
  // ... other module initializers
]);
```

### Generating IDs

```typescript
import { generateId } from '@unchainedshop/store';

// Generate a 24-character hex ID (MongoDB ObjectId compatible)
const id = generateId();
// Example: "507f1f77bcf86cd799439011"
```

### Using Drizzle Query Operators

The package re-exports common Drizzle operators for convenience:

```typescript
import {
  eq, and, or, ne, lt, gt, lte, gte,
  isNull, isNotNull, inArray, notInArray,
  asc, desc, sql
} from '@unchainedshop/store';

// Example query
const activeCountries = await db
  .select()
  .from(countries)
  .where(and(
    eq(countries.isActive, true),
    isNull(countries.deleted)
  ))
  .orderBy(asc(countries.isoCode));
```

### Partial Column Selection

Use `buildSelectColumns` to select only specific fields:

```typescript
import { buildSelectColumns } from '@unchainedshop/store';

const COLUMNS = {
  _id: countries._id,
  isoCode: countries.isoCode,
  defaultCurrencyCode: countries.defaultCurrencyCode,
} as const;

// Select specific fields
const selectColumns = buildSelectColumns(COLUMNS, ['_id', 'isoCode']);

const results = selectColumns
  ? await db.select(selectColumns).from(countries)
  : await db.select().from(countries);
```

### Full-Text Search (FTS5)

Create FTS5 virtual tables for efficient text search:

```typescript
import { createFTS, type DrizzleDb } from '@unchainedshop/store';

// Define FTS configuration
const countriesFTS = createFTS({
  ftsTable: 'countries_fts',
  sourceTable: 'countries',
  columns: ['_id', 'isoCode', 'defaultCurrencyCode'],
});

// Setup FTS table and triggers (call after table creation)
async function initializeCountriesSchema(db: DrizzleDb): Promise<void> {
  // Create main table first...

  // Then setup FTS
  await countriesFTS.setup(db);
}

// Search using FTS
async function searchCountries(db: DrizzleDb, searchText: string): Promise<string[]> {
  return countriesFTS.search(db, searchText);
}

// Example usage
const matchingIds = await searchCountries(db, 'switz');
// Returns: ['country-id-1', 'country-id-2', ...]
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `createDrizzleDb(config)` | Create a database connection |
| `createTestDb()` | Create an in-memory database for testing |
| `initializeDrizzleDb(db, initializers)` | Initialize all module schemas |
| `generateId()` | Generate a 24-character hex ID |
| `buildSelectColumns(columns, fields?)` | Build partial column selection |
| `createFTS(config)` | Create FTS5 full-text search helpers |

### Types

| Type | Description |
|------|-------------|
| `DrizzleDb` | Generic Drizzle database type |
| `DrizzleDbConfig` | Configuration for database connection |
| `DrizzleDbConnection` | Database connection with cleanup |
| `FTSConfig` | Configuration for FTS5 tables |
| `SQL` | Drizzle SQL expression type |
| `LibSQLDatabase` | LibSQL database type |

### Re-exported Operators

All common Drizzle operators are re-exported:

- **Comparison**: `eq`, `ne`, `lt`, `gt`, `lte`, `gte`
- **Logical**: `and`, `or`
- **Null checks**: `isNull`, `isNotNull`
- **Array**: `inArray`, `notInArray`
- **Ordering**: `asc`, `desc`
- **Raw SQL**: `sql`

## Module Schema Pattern

Each core module follows this pattern for schema definition:

```typescript
// packages/core-example/src/db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const examples = sqliteTable('examples', {
  _id: text('_id').primaryKey(),
  name: text('name').notNull(),
  data: text('data', { mode: 'json' }),
  created: integer('created', { mode: 'timestamp_ms' }).notNull(),
  updated: integer('updated', { mode: 'timestamp_ms' }),
  deleted: integer('deleted', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_examples_name').on(table.name),
]);

// Type inference
export type ExampleRow = typeof examples.$inferSelect;
export type ExampleInsert = typeof examples.$inferInsert;

// Row transformation (for domain objects)
export function rowToExample(row: ExampleRow): Example {
  return {
    _id: row._id,
    name: row.name,
    data: row.data ?? undefined,
    created: row.created,
    updated: row.updated ?? undefined,
    deleted: row.deleted ?? undefined,
  };
}
```

```typescript
// packages/core-example/src/db/index.ts
import { sql, type DrizzleDb } from '@unchainedshop/store';
import { examples } from './schema.js';

export * from './schema.js';

export async function initializeExamplesSchema(db: DrizzleDb): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS examples (
      _id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_examples_name ON examples(name)`);
}
```

## Migration from MongoDB

If you're migrating from `@unchainedshop/mongodb`:

```diff
- import { mongodb, generateDbObjectId } from '@unchainedshop/mongodb';
+ import { eq, generateId, type DrizzleDb } from '@unchainedshop/store';
+ import { examples, rowToExample } from '../db/index.js';

- const collection = await mongodb.collection('examples');
- const result = await collection.findOne({ _id: id });
+ const [row] = await db.select().from(examples).where(eq(examples._id, id)).limit(1);
+ const result = row ? rowToExample(row) : null;

- const newId = generateDbObjectId();
+ const newId = generateId();
```

## License

EUPL-1.2
