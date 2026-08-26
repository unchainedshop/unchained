---
sidebar_position: 22
title: MinIO/S3 File Storage
sidebar_label: MinIO/S3
description: S3-compatible file storage with MinIO or Amazon S3
---

# MinIO/S3 File Storage

S3-compatible object storage using the MinIO client — works with MinIO, Amazon S3, and other S3-compatible services. See [GridFS vs MinIO/S3](./index.md#gridfs-vs-minios3) for when to pick which.

:::warning One file backend at a time
The active file backend is the **first registered** file adapter. The `base` / `all` presets register GridFS, so to use MinIO/S3 you must register `MinioPlugin` **instead of** GridFS — don't register both. If you rely on `registerBasePlugins()` (which registers GridFS), register your plugins individually instead, omitting `GridFSPlugin`.
:::

## Installation

Not part of any preset. Register the plugin in your boot code, before `startPlatform()`:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { MinioPlugin } from '@unchainedshop/plugins/files/minio';

pluginRegistry.register(MinioPlugin);
```

Registration mounts the webhook route `POST /minio/webhook` (path configurable via `MINIO_WEBHOOK_PATH`) and warns if `MINIO_WEBHOOK_AUTH_TOKEN` is not set (webhooks are disabled without it).

The `minio` npm package is an optional peer dependency:

```bash
npm install minio
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | - | MinIO/S3 endpoint URL (required) |
| `MINIO_BUCKET_NAME` | - | Storage bucket name (required) |
| `MINIO_ACCESS_KEY` | - | Access key for authentication |
| `MINIO_SECRET_KEY` | - | Secret key for authentication |
| `MINIO_REGION` | - | Storage region |
| `MINIO_UPLOAD_PREFIX` | - | Prefix for uploaded file paths |
| `MINIO_STS_ENDPOINT` | - | STS endpoint for temporary credentials (AssumeRole) |
| `AMAZON_S3_SESSION_TOKEN` | - | AWS session token for temporary access |
| `MINIO_WEBHOOK_PATH` | `/minio/webhook` | Bucket event webhook endpoint path |
| `MINIO_WEBHOOK_AUTH_TOKEN` | - | Bearer token the webhook requires (webhooks disabled without it) |

### Local MinIO

```bash
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET_NAME=uploads
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### AWS S3

```bash
MINIO_ENDPOINT=https://s3.amazonaws.com
MINIO_BUCKET_NAME=your-bucket
MINIO_ACCESS_KEY=AKIA...
MINIO_SECRET_KEY=...
MINIO_REGION=us-east-1
```

## Upload Webhook

Clients upload directly to the bucket via pre-signed PUT URLs. To mark uploads as complete, configure a [bucket notification](https://min.io/docs/minio/linux/administration/monitoring/bucket-notifications.html) for `s3:ObjectCreated:Put` events pointing at `https://your-domain.com/minio/webhook` with the `Authorization: Bearer <MINIO_WEBHOOK_AUTH_TOKEN>` header. The handler then links the uploaded file in Unchained (`services.files.linkFile`).

## Path Structure

```
bucket/
  └── [MINIO_UPLOAD_PREFIX]/
      └── [directoryName]/
          └── [hashedFilename]
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.file-upload-plugin.minio` |
| Source | [files/minio/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/files/minio) |

## Related

- [GridFS Storage](./file-gridfs.md) - MongoDB-based storage
- [File Uploads Guide](../../guides/file-uploads.md) - File upload implementation
