---
sidebar_position: 22
title: MinIO/S3 File Storage
sidebar_label: MinIO/S3
description: S3-compatible file storage with MinIO or Amazon S3
---

# MinIO/S3 File Storage

S3-compatible object storage using the MinIO client, supporting both MinIO and Amazon S3.

:::tip Default Storage
In Unchained v5+, MinIO/S3 is the recommended file storage for production. The default local file storage adapter is suitable for development.
:::

## Installation

```typescript
import '@unchainedshop/plugins/files/minio';
```

The plugin automatically registers when environment variables are configured.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | - | MinIO/S3 endpoint URL (required) |
| `MINIO_BUCKET_NAME` | - | Storage bucket name (required) |
| `MINIO_ACCESS_KEY` | - | Access key for authentication |
| `MINIO_SECRET_KEY` | - | Secret key for authentication |
| `MINIO_REGION` | - | Storage region |
| `MINIO_UPLOAD_PREFIX` | - | Prefix for uploaded file paths |
| `MINIO_STS_ENDPOINT` | - | STS endpoint for temporary credentials |
| `AMAZON_S3_SESSION_TOKEN` | - | AWS session token for temporary access |

## Features

- **S3 Compatibility**: Works with Amazon S3, MinIO, and other S3-compatible services
- **Signed URLs**: Pre-signed URLs for secure direct uploads
- **Streaming**: Support for streaming uploads and downloads
- **File Management**: Upload, download, and delete operations
- **Multi-format Support**: Automatic MIME type detection
- **Temporary Credentials**: Support for AWS STS temporary credentials

## Use Cases

- **Production Deployments**: Scalable file storage
- **CDN Integration**: Easy integration with CloudFront or other CDNs
- **Large Files**: No file size limits
- **High Traffic**: Optimized for file serving at scale

## Usage

### Upload from Stream

```typescript
const fileData = await fileAdapter.uploadFileFromStream(
  'product-images',
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

### Create Signed Upload URL

```typescript
const signedUrl = await fileAdapter.createSignedURL(
  'product-images',
  'new-image.jpg'
);
```

### Download File

```typescript
const downloadUrl = await fileAdapter.createDownloadURL(file);
const stream = await fileAdapter.createDownloadStream({ fileId: file._id });
```

## Express Handler

```typescript
import { createMinioExpressHandler } from '@unchainedshop/plugins/files/minio/handler-express';

app.use('/files', createMinioExpressHandler());
```

## Fastify Handler

```typescript
import { createMinioFastifyHandler } from '@unchainedshop/plugins/files/minio/handler-fastify';

fastify.register(createMinioFastifyHandler);
```

## Local MinIO Setup

### Docker

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### Docker Compose

```yaml
version: '3'
services:
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

## Configuration Examples

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

## Path Structure

Files are organized using the following structure:

```
bucket/
  └── [MINIO_UPLOAD_PREFIX]/
      └── [directoryName]/
          └── [hashedFilename]
```

## Security

- **Pre-signed URLs**: Secure uploads without exposing credentials
- **Hashed Filenames**: Automatic filename hashing
- **Expiration**: Configurable URL expiration times
- **Bucket Policies**: Configure appropriate S3 bucket policies

## Production Considerations

- **CDN Integration**: Use CloudFront or similar CDN
- **Regional Deployment**: Choose appropriate regions
- **CORS**: Set up CORS for frontend uploads
- **Encryption**: Enable server-side encryption

## Local vs MinIO/S3

| Feature | Local File Storage | MinIO/S3 |
|---------|-------------------|----------|
| External Service | No | Yes |
| Scalability | Disk limits | Virtually unlimited |
| CDN Integration | Manual | Easy |
| Development Setup | Simple | Requires MinIO/S3 |
| Production Scaling | Single instance | Excellent |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.file-upload-plugin.minio` |
| Source | [files/minio/](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/files/minio/) |

## Related

- [Local Storage](./file-local.md) - Local file storage for development
- [File Uploads Guide](../../guides/file-uploads.md) - File upload implementation
- [Plugins Overview](./) - All available plugins
