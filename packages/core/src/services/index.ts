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
import { initCartProvidersService } from './initCartProviders.js';
import { updateCalculationService } from './updateCalculationService.js';
import { supportedDeliveryProvidersService } from './supportedDeliveryProviders.js';

const services = {
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
    initCartProviders: initCartProvidersService,
    updateCalculation: updateCalculationService,
    supportedDeliveryProviders: supportedDeliveryProvidersService,
  },
  products: {
    removeProduct: removeProductService,
  },
  users: {
    migrateUserData: migrateUserDataService,
    updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
  },
};

export type Services = typeof services;

export default services;
