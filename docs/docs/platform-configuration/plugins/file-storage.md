---
sidebar_position: 16
title: File Storage Plugins
sidebar_label: File Storage
---

# File Storage Plugins

:::info
File Upload and Storage Solutions with File Storage Plugins
:::

Unchained Engine provides multiple file storage adapters to handle file uploads, downloads, and management for your e-commerce platform.

## Minio/S3 Compatible Storage

S3-compatible object storage using Minio client, supporting both Minio and Amazon S3.

### Environment Variables

| NAME                     | Default Value | Description                             |
| ------------------------ | ------------- | --------------------------------------- |
| `MINIO_ENDPOINT`         |               | Minio/S3 endpoint URL (required)       |
| `MINIO_BUCKET_NAME`      |               | Storage bucket name (required)         |
| `MINIO_ACCESS_KEY`       |               | Access key for authentication          |
| `MINIO_SECRET_KEY`       |               | Secret key for authentication          |
| `MINIO_REGION`           |               | Storage region                          |
| `MINIO_UPLOAD_PREFIX`    |               | Prefix for uploaded file paths         |
| `MINIO_STS_ENDPOINT`     |               | STS endpoint for temporary credentials  |
| `AMAZON_S3_SESSION_TOKEN`|               | AWS session token for temporary access |

### Configuration

The Minio adapter automatically registers when environment variables are properly configured.

```javascript
// Automatic registration on import
import '@unchainedshop/plugins/files/minio';
```

### Features

- **S3 Compatibility**: Works with Amazon S3, Minio, and other S3-compatible services
- **Signed URLs**: Pre-signed URLs for secure direct uploads
- **Streaming**: Support for streaming uploads and downloads
- **File Management**: Upload, download, and delete operations
- **Development Mode**: Enhanced logging for debugging
- **Multi-format Support**: Automatic MIME type detection
- **Temporary Credentials**: Support for AWS STS temporary credentials

### Usage

#### Upload from Stream

```javascript
const fileData = await fileAdapter.uploadFileFromStream(
  'product-images', 
  fileStream
);
```

#### Upload from URL

```javascript
const fileData = await fileAdapter.uploadFileFromURL(
  'product-images',
  {
    fileLink: 'https://example.com/image.jpg',
    fileName: 'product-image.jpg'
  }
);
```

#### Create Signed Upload URL

```javascript
const signedUrl = await fileAdapter.createSignedURL(
  'product-images',
  'new-image.jpg'
);
```

#### Download File

```javascript
const downloadUrl = await fileAdapter.createDownloadURL(file);
const stream = await fileAdapter.createDownloadStream({ fileId: file._id });
```

### Path Structure

Files are organized using the following structure:
```
bucket/
  └── [MINIO_UPLOAD_PREFIX]/
      └── [directoryName]/
          └── [hashedFilename]
```

### Security

- **Pre-signed URLs**: Secure uploads without exposing credentials
- **Private Files**: Support for private file access (limited)
- **Hashed Filenames**: Automatic filename hashing for security
- **Expiration**: Configurable URL expiration times

## GridFS Storage

MongoDB GridFS-based file storage for storing files directly in MongoDB.

### Configuration

```javascript
// Automatic registration on import
import '@unchainedshop/plugins/files/gridfs';
```

### Features

- **MongoDB Integration**: Native MongoDB file storage
- **No External Dependencies**: Uses existing MongoDB connection
- **Streaming Support**: Efficient streaming for large files
- **Metadata Storage**: Rich metadata support
- **Automatic Cleanup**: Built-in file cleanup and management

### Environment Variables

GridFS uses the existing MongoDB connection, so no additional environment variables are required beyond the standard MongoDB configuration.

### Usage

GridFS adapter provides the same interface as other file adapters:

```javascript
// Same API as Minio adapter
const fileData = await gridfsAdapter.uploadFileFromStream(
  'documents',
  fileStream
);
```

### GridFS vs Minio Comparison

| Feature | GridFS | Minio/S3 |
|---------|---------|----------|
| External Service | No | Yes |
| Scalability | MongoDB limits | Virtually unlimited |
| CDN Integration | Manual | Easy |
| Development Setup | Simple | Requires Minio/S3 |
| Production Scaling | Limited | Excellent |
| File Size Limits | 16MB per chunk | None |
| Metadata | Rich support | Basic support |

## Express Request Handlers

Both file storage plugins provide Express middleware for handling file operations.

### Minio Express Handler

```javascript
import { createMinioExpressHandler } from '@unchainedshop/plugins/files/minio/handler-express';

app.use('/files', createMinioExpressHandler({
  // Handler configuration
}));
```

### GridFS Express Handler

```javascript
import { createGridFSExpressHandler } from '@unchainedshop/plugins/files/gridfs/handler-express';

app.use('/files', createGridFSExpressHandler({
  // Handler configuration
}));
```

## Fastify Request Handlers

Support for Fastify web framework is also available.

### Minio Fastify Handler

```javascript
import { createMinioFastifyHandler } from '@unchainedshop/plugins/files/minio/handler-fastify';

fastify.register(createMinioFastifyHandler, {
  // Handler configuration
});
```

### GridFS Fastify Handler

```javascript
import { createGridFSFastifyHandler } from '@unchainedshop/plugins/files/gridfs/handler-fastify';

fastify.register(createGridFSFastifyHandler, {
  // Handler configuration
});
```

## Development Setup

### Local Minio Setup

```bash
# Docker Compose
version: '3'
services:
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

### Environment Configuration

```bash
# For local Minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET_NAME=uploads
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# For AWS S3
MINIO_ENDPOINT=https://s3.amazonaws.com
MINIO_BUCKET_NAME=your-bucket
MINIO_ACCESS_KEY=AKIA...
MINIO_SECRET_KEY=...
MINIO_REGION=us-east-1
```

## Production Considerations

### Performance

- **CDN Integration**: Use CloudFront or similar CDN with S3
- **Regional Deployment**: Choose appropriate regions for performance
- **Caching**: Implement appropriate caching strategies
- **Compression**: Use compression for large files

### Security

- **Bucket Policies**: Configure appropriate S3 bucket policies
- **CORS**: Set up CORS for frontend uploads
- **Access Control**: Implement proper access controls
- **Encryption**: Enable server-side encryption

### Monitoring

- **Storage Usage**: Monitor storage usage and costs
- **Transfer Metrics**: Track upload/download performance
- **Error Handling**: Implement comprehensive error handling
- **Backup Strategy**: Plan for data backup and recovery

## Integration Notes

- File adapters integrate with the Unchained core file upload system
- Automatic MIME type detection and validation
- Support for both public and private files
- Integration with the Unchained permission system
- Compatible with GraphQL file upload specifications
- Support for file metadata and custom properties