---
sidebar_position: 23
title: Temp Upload
sidebar_label: Temp Upload
description: HTTP endpoint for short-lived file uploads
---

# Temp Upload

Exposes a `POST` endpoint that accepts a multipart file upload, stores it via the registered file storage adapter in the `temp-uploads` directory, and returns a download URL. Uploaded files expire after 24 hours.

This is a routes-only plugin — it registers no adapter, just the HTTP endpoint.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { TempUploadPlugin } from '@unchainedshop/plugins/files/temp-upload';

pluginRegistry.register(TempUploadPlugin);
```

## Endpoint

```
POST /temp-upload
```

The file is read from the `file` form field (falls back to the first file field in the form):

```bash
curl -X POST http://localhost:4010/temp-upload -F file=@image.png
```

The request must be authenticated and pass the `uploadTempFile` permission check. The default `loggedIn` role grants it to users with a verified email address; the `all` (anonymous) role denies it.

Response:

```json
{
  "fileId": "...",
  "url": "...",
  "expires": "2026-08-27T12:00:00.000Z"
}
```

| Status | Meaning |
|--------|---------|
| `200` | Upload succeeded |
| `400` | No file in the form data |
| `403` | Missing `uploadTempFile` permission |
| `503` | Upload or URL generation failed |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEMP_UPLOAD_API_PATH` | `/temp-upload` | Path the endpoint is mounted at |

## Plugin Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.files.temp-upload` |
| Version | `1.0.0` |
| Source | [files/temp-upload](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/files/temp-upload) |

## Related

- [File Storage Plugins](./) - GridFS and MinIO/S3 backends that store the uploads
