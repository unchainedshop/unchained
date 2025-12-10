[![npm version](https://img.shields.io/npm/v/@unchainedshop/file-upload.svg)](https://npmjs.com/package/@unchainedshop/file-upload)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/file-upload

File upload abstraction layer for the Unchained Engine. Provides a pluggable system for handling file uploads with support for signed URLs, streaming, and multiple storage backends.

## Installation

```bash
npm install @unchainedshop/file-upload
```

## Usage

```typescript
import { FileDirector, FileAdapter, type IFileAdapter } from '@unchainedshop/file-upload';

// Create a custom file adapter
const MyStorageAdapter: IFileAdapter = {
  ...FileAdapter,
  key: 'my-storage',
  label: 'My Storage Backend',
  version: '1.0.0',

  async createSignedURL(directoryName, fileName, unchainedAPI) {
    // Return signed URL for direct upload
    return {
      _id: 'file-id',
      directoryName,
      fileName,
      type: 'application/octet-stream',
      url: 'https://storage.example.com/file',
      putURL: 'https://storage.example.com/upload',
      expiryDate: new Date(Date.now() + 3600000),
    };
  },

  async createDownloadURL(file, expiry) {
    return `https://storage.example.com/${file.path}`;
  },
};

// Register the adapter
FileDirector.registerAdapter(MyStorageAdapter);

// Register upload callback for a directory
FileDirector.registerFileUploadCallback('product-images', async (file, unchainedAPI) => {
  // Process uploaded file
  console.log('File uploaded:', file.name);
});
```

## API Overview

### FileDirector

| Method | Description |
|--------|-------------|
| `registerAdapter` | Register a file storage adapter |
| `getAdapter` | Get adapter by key |
| `getAdapters` | Get all registered adapters |
| `unregisterAdapter` | Remove an adapter |
| `registerFileUploadCallback` | Register callback for upload completion |
| `getFileUploadCallback` | Get registered callback for directory |

### FileAdapter Base

Base implementation for file adapters. Override these methods:

| Method | Description |
|--------|-------------|
| `createSignedURL` | Generate signed URL for direct upload |
| `createDownloadURL` | Generate download URL for a file |
| `createDownloadStream` | Get readable stream for file download |
| `uploadFileFromStream` | Upload file from a stream |
| `uploadFileFromURL` | Upload file from external URL |
| `removeFiles` | Delete files from storage |

### Utility Functions

| Export | Description |
|--------|-------------|
| `buildHashedFilename` | Generate hashed filename for storage |
| `resolveExpirationDate` | Calculate expiration date for signed URLs |

### Types

| Export | Description |
|--------|-------------|
| `IFileAdapter` | Interface for file adapter implementations |
| `UploadFileData` | Data returned after file upload |
| `UploadedFile` | Representation of an uploaded file |
| `UploadFileCallback` | Callback function type for upload events |

## Implementing a Custom Adapter

```typescript
import { FileAdapter, type IFileAdapter } from '@unchainedshop/file-upload';

const S3Adapter: IFileAdapter = {
  ...FileAdapter,
  key: 's3-adapter',
  label: 'AWS S3 Storage',
  version: '1.0.0',

  async createSignedURL(directoryName, fileName, unchainedAPI) {
    // Generate presigned S3 URL
  },

  async createDownloadURL(file, expiry) {
    // Generate presigned download URL
  },

  async uploadFileFromStream(directoryName, rawFile, unchainedAPI) {
    // Stream upload to S3
  },

  async removeFiles(files, unchainedContext) {
    // Delete objects from S3
  },

  async createDownloadStream(file, unchainedAPI) {
    // Return S3 object as stream
  },

  async uploadFileFromURL(directoryName, fileInput, unchainedAPI) {
    // Fetch and upload from URL
  },
};
```

## License

EUPL-1.2
