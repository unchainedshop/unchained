---
title: "Built-In Services"
description: Learn about the layered approach of Unchained
---

### `bookmarkServices`
  Enables you to manage bookmarks
  - **migrateBookmarksService(params: [MigrateBookmarksService](https://docs.unchained.shop/types/types/bookmarks.MigrateBookmarksService.html))**: Used to migrate bookmarked products from one user account to another. Useful for example when we want to keep a product a user has bookmarked before registering after they register.

### `fileServices`

  - **linkFile(params: [LinkFileService](https://docs.unchained.shop/types/types/files.LinkFileService.html))**: Used to link files uploaded to an S3-compatible storage server after a successful upload using `createSignedURL`.
  - **createSignedURL(params: [CreateSignedURLService](https://docs.unchained.shop/types/types/files.CreateSignedURLService.html))**: Returns pre-signed URLs, a client can upload files directly to an S3-compatible cloud storage server (S3) without exposing the S3 credentials to the user. 
  - **uploadFileFromURL(params: [UploadFileFromURLService](https://docs.unchained.shop/types/types/files.UploadFileFromURLService.html))**: Used to upload files from URL.
  - **uploadFileFromStream(params: [UploadFileFromStreamService](https://docs.unchained.shop/types/types/files.UploadFileFromStreamService.html))**: Used to upload base64 file stream.
  - **removeFiles(params: [RemoveFilesService](https://docs.unchained.shop/types/types/files.RemoveFilesService.html))**: Used to remove a single file.

### `orderServices`
  - **migrateOrderCartsService(params: [MigrateOrderCartsService](https://docs.unchained.shop/types/types/orders.MigrateOrderCartsService.html))**: Used to migrate order cart from one user to another. useful for example when we want to keep products a user has added to cart before logging in after they log in.
  - **createUserCartService(params: [CreateUserCartService](https://docs.unchained.shop/types/types/orders.CreateUserCartService.html))**: Used to create cart for current user or a user with the specified ID through its arguments.

### `productServices`
- **removeProduct(params: [RemoveProductService](https://docs.unchained.shop/types/types/products.RemoveProductService.html))**: Used to delete product. **Note once a product is deleted there is no way reverting the action**.

### `userServices`
  - **getUserCountry(params: [GetUserRoleActionsService](https://docs.unchained.shop/types/types/user.GetUserRoleActionsService.html))**: Returns the specified user country
  - **getUserLanguage(params: [GetUserLanguageService](https://docs.unchained.shop/types/types/user.GetUserLanguageService.html))**: Returns the specified user Language
  - **getUserRoleActions(params: [GetUserRoleActionsService](https://docs.unchained.shop/types/types/user.GetUserRoleActionsService.html))**: Returns the specified user roles
  - **updateUserAvatarAfterUpload(params: [UpdateUserAvatarAfterUploadService](https://docs.unchained.shop/types/types/user.UpdateUserAvatarAfterUploadService.html))**: Used to update user avatar.
