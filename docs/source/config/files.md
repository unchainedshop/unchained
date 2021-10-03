---
title: "Module: Files"
description: Configure the Files Module
---

Files are manged in [minio](https://docs.unchained.shop/) a [amazon s3](https://aws.amazon.com/s3/) compatible object cloud storage.
for more information and instruction on how to install or configure your own minio server refer to the [official documentation](https://docs.min.io/minio/k8s/).
In order to connect your minio server with unchained you need to provide few environment variable namely

- **`MINIO_ENDPOINT`** - server address in the format similar to `http|s://domain-name:port`
- **`MINIO_ACCESS_KEY`** - your minio access key
- **`MINIO_SECRET_KEY`** - your minio secret key
- **`MINIO_BUCKET_NAME`** - bucket name

That's it if you have a configured working minio server, you are ready to start using it to store all the media files used in unchained.

**Note**: don't forget to give the bucket public read access.

### pre-signed URL upload

The current file system supports pre-signed URL uploads for assortment, product and user avatar uploads by default, this are `prepareAssortmentMediaUpload`, `prepareProductMediaUpload` and `prepareUserAvatarUpload`. 
In order to use pre-signed URL upload method successfully either of the two methods available.

1. **Manual upload confirmation** - this is achieved by calling either one of the above API which returns a signed put URL to be used to upload the media file along with the uploaded media ticket ID. once the upload successfully completes confirm the successful completion of the upload by calling `confirmMediaUpload`.

2. **Webhook based confirmation** if you don't want to perform multiple request when uploading media files you can setup a webhook that listens for `s3:ObjectCreated:Put` and link the uploaded file with the media there. To make things easier we have already configured a minimal webhook the does just that and all you have to do is import at in boot file.

```js boot.js
import 'meteor/unchained:core-files-next/plugins/minio-webhook';
```
After this unchained will listen to `s3:ObjectCreated:Put` event from minio and link media on successful uploads. Make sure to point your minio webhook to `http|s://your-domain:port/minio` to use this webhook.

