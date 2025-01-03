---
sidebar_position: 5
sidebar_label: Files
title: Files
---
# Files
:::
Configure the Files Module
:::



Files are manged in [minio](https://docs.unchained.shop/) a [amazon s3](https://aws.amazon.com/s3/) compatible object cloud storage.
for more information and instruction on how to install or configure your own minio server refer to the [official documentation](https://docs.min.io/minio/k8s/).
## Setup minio basics

In order to work with minio we have to first  [download](https://min.io/download) and install the server on our local development environment or hosted on a remote server

Go ahead and download minio client you will use to configure your minio server and the actual minio server for your operating system [here](https://min.io/download). Or if you want to use docker instead you can follow [MinIO Docker quick start Guide](https://docs.min.io/docs/minio-docker-quickstart-guide.html).

Once you have configured minio server and client successfully following the installation guide you can now point unchained engine to store media files on it.

To connect your minio server with unchained you need to provide few environment variable listed below

- **`MINIO_ENDPOINT`** - server address in the format similar to `http|s://domain-name:port`
- **`MINIO_ACCESS_KEY`** - your minio access key
- **`MINIO_SECRET_KEY`** - your minio secret key
- **`MINIO_BUCKET_NAME`** - bucket name
- **`MINIO_WEBHOOK_AUTH_TOKEN`** - JWT token set initially when configuring the webhook

**Note**: don't forget to give the bucket public READ access.

## How to use unchained api to store medias

Currently there are 2 ways you can upload media files mainly assortment, product and user avatar to minio using unchained api.
 
 ### 1. Directly uploading media BLOB 
 If you are using `addProductMedia`, `addAssortmentMedia` & `updateUserAvatar` methods you are not required to do extra configuration and setup a webhook. a minio server with all the default configuration and a public read access enabled bucket and you are ready to go. 

  #### Flow of usage
  Calling the corresponding media upload mutation listed above with the required parameters will be uploaded upon successful completion
  eg. below is for uploading product media.

  ```graphql
    mutation addProductMedia($media: Upload!, $productId: ID!) {
        addProductMedia(media: $media, productId: $productId) {
          _id
          tags
        }
    }
  ```
### 2. pre-signed URL upload

The current file system supports pre-signed URL uploads for assortment, product and user avatar through the given API endpoints, this are `prepareAssortmentMediaUpload`, `prepareProductMediaUpload` and `prepareUserAvatarUpload`. 
In order to use pre-signed URL upload method successfully either of the two approach's are available.

  #### Flow of usage

**Manual upload confirmation**
This is achieved by calling one of the above API which return a signed put URL to be used for uploading the media file along with the uploaded media ticket ID. 
Once the upload successfully completes confirm the successful completion of the upload by calling `confirmMediaUpload`. 
eg. below uses product media upload.

```graphql
mutation prepareProductMediaUpload($mediaName: String!, $productId: ID!) {
    prepareProductMediaUpload(mediaName: $mediaName, productId: $productId) {
        _id
        putURL
        expires
    }   
}

```

As you can see the above mutation will not upload the media instead it will take the media file name and return a signed put URL you will use to upload the media along with the expiration time of that URL and id. 
once you receive the put url upload the media file using any tool of your choice by making a put request to the given URL.

Finally tell unchained the file has been uploaded successfully by calling the `confirmMediaUpload` API with the required parameters.

```graphql
    mutation confirmMediaUpload( $mediaUploadTicketId: ID!, $size: Int!, $type: String!) {
        confirmMediaUpload(mediaUploadTicketId: $mediaUploadTicketId, size: $size, type: $type) {
            _id
            name
            type
            size
            url
        }  
    }
```

in this case `mediaUploadTicketId` is the id provided to you when you first call `prepareProductMediaUpload` while `size` and `type`are as there name suggests size and type of the file uploaded.


**Webhook based confirmation** 
If you don't want to perform multiple request when uploading media files you can setup a webhook that listens for `s3:ObjectCreated:Put` and link the uploaded file with the media. To make things easier we have already configured a minimal webhook the does just that and all you have to do is import at in boot file.

```js boot.js
import { minioHandler } from '@unchainedshop/plugins/files/minio/minio-webhook-express';
```

or

```js boot.js
import { minioHandler } from '@unchainedshop/plugins/files/minio/minio-webhook-fastify';
```

After this unchained will listen to `s3:ObjectCreated:Put` event from minio and link media on successful uploads. Make sure to point your minio webhook to `http|s://your-domain:port/minio` to use this webhook.

#### Flow of usage

the first and second steps are identical to manual upload in which you call one of the API's that will return a pre-signed URL for each media type followed by uploading the media BLOB to the provided URL. the only difference with this method is you don't have to confirm a successful media upload by calling `confirmMediaUpload` because it will be handled by the webhook.

in order to successfully configure a webhook follow the this guide from the official [minio documentation](https://docs.min.io/docs/minio-bucket-notification-guide.html).

**Note** when configuring a webhook make sure you provide it with a secure [JWT](https://jwt.io/) token and provide that token to unchained using the environment variable  `MINIO_WEBHOOK_AUTH_TOKEN`. if you are using the default provided webhook, make sure you point your webhook to `http|s://your-domain/minio`.

```js
http://localhost:4010/minio
https://unchained-remote-instance/minio
```