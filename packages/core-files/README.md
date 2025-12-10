[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-files.svg)](https://npmjs.com/package/@unchainedshop/core-files)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-files

File management module for the Unchained Engine. Handles media file metadata storage and URL normalization.

## Installation

```bash
npm install @unchainedshop/core-files
```

## Usage

```typescript
import { configureFilesModule } from '@unchainedshop/core-files';

const filesModule = await configureFilesModule({
  db,
  options: {
    transformUrl: (url, params) => url, // Optional URL transformation
  },
});

// Create a file record
const fileId = await filesModule.create({
  name: 'product-image.jpg',
  type: 'image/jpeg',
  path: 'products/123',
  url: '/uploads/product-image.jpg',
});

// Find file and normalize URL
const file = await filesModule.findFile({ fileId });
const normalizedUrl = filesModule.normalizeUrl(file.url, {});
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureFilesModule` | Configure and return the files module |

### Queries

| Method | Description |
|--------|-------------|
| `findFile` | Find file by ID or URL |
| `findFiles` | Find files with custom selector |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new file record |
| `update` | Update an existing file |
| `delete` | Delete a file record |
| `deleteMany` | Delete multiple file records |
| `unexpire` | Remove expiration from a file |

### Helper Methods

| Method | Description |
|--------|-------------|
| `normalizeUrl` | Normalize and transform file URL |

### Utilities

| Export | Description |
|--------|-------------|
| `getFileAdapter` | Get configured file storage adapter |
| `getFileFromFileData` | Convert file data to File object |
| `filesSettings` | Access file module settings |

### Types

| Export | Description |
|--------|-------------|
| `File` | File document type |
| `FilesModule` | Module interface type |
| `FilesSettingsOptions` | Configuration options type |

## Configuration

```typescript
const filesModule = await configureFilesModule({
  db,
  options: {
    transformUrl: (url, params) => {
      // Transform URLs for CDN, thumbnails, etc.
      return `https://cdn.example.com${url}`;
    },
  },
});
```

## Events

| Event | Description |
|-------|-------------|
| `FILE_CREATE` | Emitted when a file is created |
| `FILE_UPDATE` | Emitted when a file is updated |
| `FILE_REMOVE` | Emitted when a file is removed |

## License

EUPL-1.2
