import { migrateUserDataService } from './migrateUserDataService.js';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUploadService.js';
import { linkFileService } from './linkFileService.js';
import { createSignedURLService } from './createSignedURLService.js';
import { uploadFileFromURLService } from './uploadFileFromURLService.js';
import { uploadFileFromStreamService } from './uploadFileFromStreamService.js';
import { removeFilesService } from './removeFilesService.js';
import { createDownloadStreamService } from './createDownloadStreamService.js';
import { migrateBookmarksService } from './migrateBookmarksService.js';
import { migrateOrderCartsService } from './migrateOrderCartService.js';
import { nextUserCartService } from './nextUserCartService.js';
import { removeProductService } from './removeProductService.js';

export interface UserServices {
  updateUserAvatarAfterUpload: typeof updateUserAvatarAfterUploadService;
  migrateUserData: typeof migrateUserDataService;
}

export interface FileServices {
  linkFile: typeof linkFileService;
  uploadFileFromStream: typeof uploadFileFromStreamService;
  uploadFileFromURL: typeof uploadFileFromURLService;
  createSignedURL: typeof createSignedURLService;
  removeFiles: typeof removeFilesService;
  createDownloadStream: typeof createDownloadStreamService;
}

export interface BookmarkServices {
  migrateBookmarks: typeof migrateBookmarksService;
}

export interface OrderServices {
  migrateOrderCarts: typeof migrateOrderCartsService;
  nextUserCart: typeof nextUserCartService;
}

export interface ProductServices {
  removeProduct: typeof removeProductService;
}

export interface Services {
  bookmarks: BookmarkServices;
  files: FileServices;
  orders: OrderServices;
  products: ProductServices;
  users: UserServices;
}

export default {
  bookmarks: {
    migrateBookmarks: migrateBookmarksService,
  },
  files: {
    linkFile: linkFileService,
    createSignedURL: createSignedURLService,
    uploadFileFromURL: uploadFileFromURLService,
    uploadFileFromStream: uploadFileFromStreamService,
    removeFiles: removeFilesService,
    createDownloadStream: createDownloadStreamService,
  },
  orders: {
    migrateOrderCarts: migrateOrderCartsService,
    nextUserCart: nextUserCartService,
  },
  products: {
    removeProduct: removeProductService,
  },
  users: {
    migrateUserData: migrateUserDataService,
    updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
  },
};
