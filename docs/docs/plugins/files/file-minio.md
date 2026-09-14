---
sidebar_position: 22
title: MinIO/S3 File Storage
sidebar_label: MinIO/S3
description: S3-compatible file storage using the MinIO client
---

# MinIO/S3 File Storage

The adapter stores objects using the MinIO client and creates signed PUT URLs for direct uploads.

## Installation

```bash
npm install minio
```

```typescript
import { FileDirector } from '@unchainedshop/file-upload';
import '@unchainedshop/plugins/files/minio/index.js';

// Remove the GridFS adapter if it was loaded by a preset.
FileDirector.unregisterAdapter('shop.unchained.file-upload-plugin.gridfs');
```

The adapter registers on import. Configure the environment beforehand so its client can initialize. File services select the first registered file adapter.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | Unset | Endpoint URL, including scheme and optional port; required |
| `MINIO_BUCKET_NAME` | Unset | Existing bucket name; required |
| `MINIO_ACCESS_KEY` | Unset | Access key |
| `MINIO_SECRET_KEY` | Unset | Secret key |
| `MINIO_REGION` | Unset | Storage region |
| `MINIO_UPLOAD_PREFIX` | Empty | Object-key prefix |
| `MINIO_STS_ENDPOINT` | Unset | STS endpoint for the MinIO assume-role provider |
| `AMAZON_S3_SESSION_TOKEN` | Unset | Session token for temporary credentials |
| `MINIO_WEBHOOK_AUTH_TOKEN` | Unset | Required bearer token for upload notification handlers |

Example for a local server with an existing `uploads` bucket:

```bash
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET_NAME=uploads
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## File Operations

The adapter methods handle object storage. Use the core file services when a file also needs metadata persisted and upload callbacks invoked.

```typescript
import { MinioAdapter } from '@unchainedshop/plugins/files/minio/index.js';

// rawFile uses the same shape as a GraphQL multipart upload.
const rawFile = Promise.resolve({
  filename: 'product-image.jpg',
  mimetype: 'image/jpeg',
  createReadStream: () => fileStream,
});
const uploaded = await MinioAdapter.uploadFileFromStream('product-images', rawFile, unchainedAPI);

const imported = await MinioAdapter.uploadFileFromURL('product-images', {
  fileLink: 'https://example.com/image.jpg',
  fileName: 'product-image.jpg',
}, unchainedAPI);

const signed = await MinioAdapter.createSignedURL('product-images', 'new-image.jpg', unchainedAPI);
// Upload directly to signed.putURL before signed.expiryDate.

// file is a stored file document containing _id and path.
const downloadUrl = await MinioAdapter.createDownloadURL(file);
const stream = await MinioAdapter.createDownloadStream(file, unchainedAPI);
```

Downloads return the object's public URL. Private download URLs are not implemented: `createDownloadURL` throws for files with `meta.isPrivate`.

## Upload Notifications

The Express and Fastify handlers accept `s3:ObjectCreated:Put` notifications. Requests must include `Authorization: Bearer <MINIO_WEBHOOK_AUTH_TOKEN>`. The handlers need the request's Unchained context and call `services.files.linkFile` to complete the upload.

Mount the handler through `connect()` so the context is available:

```typescript
import express from 'express';
import { connect } from '@unchainedshop/api/express';
import minioHandler from '@unchainedshop/plugins/files/minio/handler-express.js';

connect(app, engine, {
  initPluginMiddlewares(app) {
    app.post('/files/minio', express.json(), minioHandler);
  },
});
```

```typescript
import { connect } from '@unchainedshop/api/fastify';
import minioHandler from '@unchainedshop/plugins/files/minio/handler-fastify.js';

connect(fastify, engine, {
  initPluginMiddlewares(app) {
    app.post('/files/minio', minioHandler);
  },
});
```

Configure the object store to send notifications to the matching endpoint. These handlers are default exports, not router factories.

## Object Keys and Limits

Uploads use `[MINIO_UPLOAD_PREFIX]/[directoryName]/[hashedFilename]`, omitting empty segments. Configure bucket access and upload CORS on the object store.

The current removal implementation does not prepend `MINIO_UPLOAD_PREFIX`, and notification handling assumes an object key compatible with its file-ID extraction. Test prefixed paths and upload completion against your store before enabling a prefix.

## Related

- [GridFS Storage](./file-gridfs.md)
- [File Uploads Guide](../../guides/file-uploads.md)
- [Adapter source](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/files/minio/)
