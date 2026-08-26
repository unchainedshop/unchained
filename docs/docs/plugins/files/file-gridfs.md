---
sidebar_position: 21
title: GridFS File Storage
sidebar_label: GridFS
description: MongoDB GridFS file storage for simple deployments
---

# GridFS File Storage

Stores uploaded files directly in MongoDB via GridFS — no external storage service needed. This is the default file backend. See [GridFS vs MinIO/S3](./index.md#gridfs-vs-minios3) for when to pick which.

## Installation

Included in the [`base` and `all` presets](../../platform-configuration/plugin-presets.md) — registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { GridFSPlugin } from '@unchainedshop/plugins/files/gridfs';

pluginRegistry.register(GridFSPlugin);
```

Register before `startPlatform()`. Registration mounts the file route `ALL /gridfs/:directoryName/:fileName` (base path configurable via `GRIDFS_PUT_SERVER_PATH`) — handling `PUT` (signed uploads), `GET` (downloads), and `OPTIONS` (CORS preflight) — and adds the `gridfsFileUploads` database module.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GRIDFS_PUT_SERVER_PATH` | `/gridfs` | Base URL path for the file upload/download endpoint |
| `UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET` | - | Random secret used to HMAC-sign upload and download URLs. Without it, PUT uploads and signed downloads fail (registration logs a warning). |

## Usage

Files are uploaded through the regular file-upload GraphQL flow (e.g. `prepareProductMediaUpload`): Unchained returns a signed PUT URL under `GRIDFS_PUT_SERVER_PATH`, the client PUTs the file there, and the signature and expiry are verified server-side. See the [File Uploads guide](../../guides/file-uploads.md).

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.file-upload-plugin.gridfs` |
| Source | [files/gridfs/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/files/gridfs) |

## Related

- [MinIO/S3 Storage](./file-minio.md) - S3-compatible storage
- [File Uploads Guide](../../guides/file-uploads.md) - File upload implementation
