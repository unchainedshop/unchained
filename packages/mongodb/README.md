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

## License

EUPL-1.2
