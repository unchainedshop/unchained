---
sidebar_position: 21
title: GridFS File Storage (Deprecated)
sidebar_label: GridFS (Deprecated)
description: MongoDB GridFS file storage - deprecated in v5
---

# GridFS File Storage

:::danger Deprecated in v5
GridFS file storage has been **removed in Unchained Engine v5** as MongoDB is no longer supported.

**Migration options:**
- Use [MinIO/S3 Storage](./file-minio.md) for production deployments
- Use local file storage for development

See the [Migration Guide](/docs/migrations) for upgrade instructions.
:::

MongoDB GridFS-based file storage for storing files directly in MongoDB.

:::warning v4 Only
This plugin is only available in Unchained Engine v4 and earlier. For v5+, use [MinIO/S3 Storage](./file-minio.md) or local file storage.
:::

## Installation

**Express:**
```typescript
import gridfsModules from '@unchainedshop/plugins/files/gridfs';
import '@unchainedshop/plugins/files/gridfs';
import gridfsHandler from '@unchainedshop/plugins/files/gridfs/handler-express';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs' } = process.env;

// Add module to platform options
const unchainedApi = await startPlatform({
  modules: {
    gridfsFileUploads: gridfsModules,
  },
});

app.use(GRIDFS_PUT_SERVER_PATH, gridfsHandler);
```

**Fastify:**
```typescript
import gridfsModules from '@unchainedshop/plugins/files/gridfs';
import '@unchainedshop/plugins/files/gridfs';
import gridfsHandler from '@unchainedshop/plugins/files/gridfs/handler-fastify';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs' } = process.env;

// Add module to platform options
const unchainedApi = await startPlatform({
  modules: {
    gridfsFileUploads: gridfsModules,
  },
});

fastify.register((s, opts, registered) => {
  // Disable JSON parsing for file uploads
  s.removeAllContentTypeParsers();
  s.addContentTypeParser('*', function (req, payload, done) {
    done(null);
  });
  s.route({
    url: GRIDFS_PUT_SERVER_PATH + '/:directoryName/:fileName',
    method: ['GET', 'PUT', 'OPTIONS'],
    handler: gridfsHandler,
  });
  registered();
});
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GRIDFS_PUT_SERVER_PATH` | `/gridfs` | URL path for file upload/download endpoint |

## Features

- **MongoDB Integration**: Native MongoDB file storage
- **No External Dependencies**: Uses existing MongoDB connection
- **Streaming Support**: Efficient streaming for large files
- **Metadata Storage**: Rich metadata support
- **Automatic Cleanup**: Built-in file cleanup and management
- **Simple Setup**: No additional services required

## Use Cases

- **Development**: Quick setup without external services
- **Small Deployments**: When S3/Minio is overkill
- **Self-Contained**: When you want everything in MongoDB

## Usage

### Upload from Stream

```typescript
const fileData = await fileAdapter.uploadFileFromStream(
  'documents',
  fileStream
);
```

### Upload from URL

```typescript
const fileData = await fileAdapter.uploadFileFromURL(
  'product-images',
  {
    fileLink: 'https://example.com/image.jpg',
    fileName: 'product-image.jpg'
  }
);
```

### Download File

```typescript
const stream = await fileAdapter.createDownloadStream({ fileId: file._id });
```

## Limitations

- **Scalability**: Limited by MongoDB storage
- **CDN Integration**: Requires manual setup
- **File Size**: 16MB per chunk limit
- **Performance**: Not optimized for high-traffic file serving

## GridFS vs MinIO/S3

| Feature | GridFS | MinIO/S3 |
|---------|--------|----------|
| External Service | No | Yes |
| Scalability | MongoDB limits | Virtually unlimited |
| CDN Integration | Manual | Easy |
| Development Setup | Simple | Requires MinIO/S3 |
| Production Scaling | Limited | Excellent |
| File Size Limits | 16MB per chunk | None |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.file-upload-plugin.gridfs` |
| Source | [files/gridfs/](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/files/gridfs/) |

## Related

- [MinIO/S3 Storage](./file-minio.md) - S3-compatible storage
- [File Uploads Guide](../../guides/file-uploads.md) - File upload implementation
- [Plugins Overview](./) - All available plugins
