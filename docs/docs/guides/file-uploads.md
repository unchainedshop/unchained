---
sidebar_position: 9
title: File Uploads
sidebar_label: File Uploads
description: Managing file uploads with GridFS (default) or MinIO/S3-compatible storage
---

# File Uploads

Unchained uses pre-signed PUT URLs for all media uploads. The flow is storage-agnostic:

1. Request an upload ticket via GraphQL → get `putURL`
2. `PUT` the file to `putURL`
3. The file gets linked — automatically (GridFS, MinIO webhook) or via `confirmMediaUpload`

Two storage adapters ship with `@unchainedshop/plugins`: **GridFS** (default, stores files in MongoDB, registered by `registerBasePlugins()`) and **MinIO/S3** (opt-in). The engine uses the *first registered* file adapter, so register exactly one.

## GridFS (Default)

Already active if you use the `base` or `all` preset — no extra infrastructure needed. Files are stored in MongoDB GridFS and served by the engine itself.

```bash
# Required for PUT uploads and signed downloads
UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET=some-long-random-string
```

| Environment Variable | Default | Description |
|----------------------|---------|-------------|
| `UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET` | - | Secret used to sign `putURL`s and download URLs (required) |
| `GRIDFS_PUT_SERVER_PATH` | `/gridfs` | Base path of the file route |

The plugin registers the route `ALL /gridfs/:directoryName/:fileName` on the engine. Upload tickets return a signed `putURL` (built from `ROOT_URL`) like `https://your-engine.com/gridfs/product-medias/<fileName>?e=<expiry>&s=<signature>`. After a successful `PUT`, the handler links the file automatically — **no `confirmMediaUpload` call needed**. `GET` on the same route serves the file (private files require a signed URL).

## MinIO / S3

For direct-to-storage uploads, register `MinioPlugin`. Because the engine picks the *first* registered file adapter, register it **before** any preset (presets register GridFS):

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { MinioPlugin } from '@unchainedshop/plugins/files/minio';

pluginRegistry.register(MinioPlugin); // must come first
registerBasePlugins();
```

| Environment Variable | Default | Description |
|----------------------|---------|-------------|
| `MINIO_ENDPOINT` | - | Storage endpoint URL (required) |
| `MINIO_BUCKET_NAME` | - | Bucket name (required) |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | - | Credentials |
| `MINIO_REGION` | - | Region (for AWS S3 etc.) |
| `MINIO_STS_ENDPOINT` | - | Optional STS endpoint for temporary credentials |
| `MINIO_UPLOAD_PREFIX` | - | Key prefix inside the bucket |
| `MINIO_WEBHOOK_AUTH_TOKEN` | - | Bearer token for the upload webhook (webhook disabled without it) |
| `MINIO_WEBHOOK_PATH` | `/minio/webhook` | Webhook route path |

Works with any S3-compatible endpoint (AWS S3, DigitalOcean Spaces, Cloudflare R2, self-hosted MinIO) — point `MINIO_ENDPOINT` at the service and supply its credentials.

### Upload Confirmation Webhook

The plugin auto-registers a `POST` route at `MINIO_WEBHOOK_PATH` (default `/minio/webhook`) — there is nothing to import or mount. It expects `Authorization: Bearer <MINIO_WEBHOOK_AUTH_TOKEN>` and links the uploaded file on `s3:ObjectCreated:Put` events, replacing the manual `confirmMediaUpload` step.

Configure MinIO to call it:

```bash
mc admin config set local notify_webhook:unchained \
  endpoint="https://your-engine.com/minio/webhook" \
  auth_token="your-secure-token"

mc admin service restart local

mc event add local/your-bucket arn:minio:sqs::unchained:webhook --event "put"
```

`auth_token` must equal `MINIO_WEBHOOK_AUTH_TOKEN`. Without the webhook (e.g. plain AWS S3), call `confirmMediaUpload` after each upload instead.

## Upload Mutations

All `prepare*Upload` mutations return a `MediaUploadTicket`:

```graphql
type MediaUploadTicket {
  _id: ID!
  putURL: String!
  expires: DateTime!
}
```

```graphql
mutation PrepareProductMediaUpload($mediaName: String!, $productId: ID!) {
  prepareProductMediaUpload(mediaName: $mediaName, productId: $productId) {
    _id
    putURL
    expires
  }
}

mutation PrepareAssortmentMediaUpload($mediaName: String!, $assortmentId: ID!) {
  prepareAssortmentMediaUpload(mediaName: $mediaName, assortmentId: $assortmentId) {
    _id
    putURL
    expires
  }
}

mutation PrepareUserAvatarUpload($mediaName: String!, $userId: ID) {
  prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
    _id
    putURL
    expires
  }
}
```

Manage product media with `reorderProductMedia(sortKeys: [ReorderProductMediaInput!]!)` and `removeProductMedia(productMediaId: ID!)`.

## Client Upload

```typescript
async function uploadFile(file: File, putURL: string) {
  const response = await fetch(putURL, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!response.ok) throw new Error('Upload failed');
}
```

## Manual Confirmation

Only needed when no automatic linking happens (MinIO/S3 without the webhook):

```graphql
mutation ConfirmMediaUpload($mediaUploadTicketId: ID!, $size: Int!, $type: String!) {
  confirmMediaUpload(mediaUploadTicketId: $mediaUploadTicketId, size: $size, type: $type) {
    _id
    name
    type
    size
    url
  }
}
```

`mediaUploadTicketId` is the `_id` from the prepare mutation.

## Related

- [Files Module](../platform-configuration/modules/files.md) - File module configuration
