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
| [`shop.unchained.file-upload-plugin.minio`](./file-minio.md) | S3/MinIO compatible storage (recommended) |
| [`shop.unchained.file-upload-plugin.gridfs`](./file-gridfs.md) | MongoDB GridFS storage (deprecated in v5) |

:::note v5 Changes
In Unchained Engine v5, GridFS has been deprecated as MongoDB is no longer supported. Use MinIO/S3 or local file storage instead.
:::
