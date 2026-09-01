---
sidebar_position: 6
title: File Storage Plugins
sidebar_label: File Storage
description: File storage plugins for Unchained Engine
---

# File Storage Plugins

File storage plugins handle file uploads and storage.

| Adapter Key | Description |
|-------------|-------------|
| [`shop.unchained.file-upload-plugin.gridfs`](./file-gridfs.md) | MongoDB GridFS storage |
| [`shop.unchained.file-upload-plugin.minio`](./file-minio.md) | S3/MinIO compatible storage |

:::warning One file backend at a time
The active file backend is the **first registered** file adapter. The `base` / `all` presets register GridFS; to use MinIO/S3, register `MinioPlugin` **instead of** `GridFSPlugin` (see [MinIO/S3](./file-minio.md)).
:::

## GridFS vs MinIO/S3

| Feature | GridFS | MinIO/S3 |
|---------|--------|----------|
| External service | No | Yes |
| Scalability | MongoDB limits | Virtually unlimited |
| CDN integration | Manual | Easy |
| Setup | None (preset default) | Requires MinIO/S3 service |
