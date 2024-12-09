import { migrateUserDataService } from './migrateUserData.js';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUpload.js';
import { linkFileService } from './linkFileService.js';
import { createSignedURLService } from './createSignedURL.js';
import { uploadFileFromURLService } from './uploadFileFromURL.js';
import { uploadFileFromStreamService } from './uploadFileFromStream.js';
import { removeFilesService } from './removeFiles.js';
import { createDownloadStreamService } from './createDownloadStream.js';
import { migrateBookmarksService } from './migrateBookmarks.js';
import { migrateOrderCartsService } from './migrateOrderCart.js';
import { nextUserCartService } from './nextUserCart.js';
import { removeProductService } from './removeProduct.js';
import { initCartProvidersService } from './initCartProviders.js';
import { updateCalculationService } from './updateCalculation.js';
import { supportedDeliveryProvidersService } from './supportedDeliveryProviders.js';
import { supportedPaymentProvidersService } from './supportedPaymentProviders.js';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.js';
import { createEnrollmentFromCheckoutService } from './createEnrollmentFromCheckout.js';
import { searchAssortmentsService } from './searchAssortments.js';
import { searchProductsService } from './searchProducts.js';
import { calculateDiscountTotalService } from './calculateDiscountTotal.js';
import { registerPaymentCredentialsService } from './registerPaymentCredentials.js';
import { processOrderService } from './processOrder.js';
import { checkoutOrderService } from './checkoutOrder.js';
import { confirmOrderService } from './confirmOrder.js';
import { rejectOrderService } from './rejectOrder.js';
import { discountedEntitiesService } from './discountedEntities.js';
import { createManualOrderDiscountService } from './createManualOrderDiscount.js';
import { initializeEnrollmentService } from './initializeEnrollment.js';
import { activateEnrollmentService } from './activateEnrollment.js';
import { terminateEnrollmentService } from './terminateEnrollment.js';

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
    registerPaymentCredentials: registerPaymentCredentialsService,
    calculateDiscountTotal: calculateDiscountTotalService,
    migrateOrderCarts: migrateOrderCartsService,
    nextUserCart: nextUserCartService,
    initCartProviders: initCartProvidersService,
    updateCalculation: updateCalculationService,
    supportedDeliveryProviders: supportedDeliveryProvidersService,
    supportedPaymentProviders: supportedPaymentProvidersService,
    supportedWarehousingProviders: supportedWarehousingProvidersService,
    processOrder: processOrderService,
    checkoutOrder: checkoutOrderService,
    confirmOrder: confirmOrderService,
    rejectOrder: rejectOrderService,
    discountedEntities: discountedEntitiesService,
    createManualOrderDiscount: createManualOrderDiscountService,
  },
  products: {
    removeProduct: removeProductService,
  },
  users: {
    migrateUserData: migrateUserDataService,
    updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
  },
  enrollments: {
    createEnrollmentFromCheckout: createEnrollmentFromCheckoutService,
    processEnrollment: processOrderService,
    initializeEnrollment: initializeEnrollmentService,
    activateEnrollment: activateEnrollmentService,
    terminateEnrollment: terminateEnrollmentService,
  },
  filters: {
    searchAssortments: searchAssortmentsService,
    searchProducts: searchProductsService,
  },
};

export type Services = typeof services;

export default services;
