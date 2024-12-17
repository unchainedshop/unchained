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
import { deleteUserService } from './deleteUser.js';
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
import { invalidateFilterCacheService } from './invalidateFilterCache.js';
import { fullfillQuotationService } from './fullfillQuotation.js';
import { processQuotationService } from './processQuotation.js';
import { proposeQuotationService } from './proposeQuotation.js';
import { rejectQuotationService } from './rejectQuotation.js';
import { verifyQuotationService } from './verifyQuotation.js';
import { loadFiltersService } from './loadFilters.js';
import { loadFilterOptionsService } from './loadFilterOptions.js';
import { ercMetadataService } from './ercMetadata.js';
import { Modules } from '../modules.js';

// TODO: Auto-Inject Unchained API as last parameter
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy

function bindMethodsToModules(modules: Modules) {
  return {
    get(target, prop, receiver) {
      const value = target[prop];
      if (value instanceof Function) {
        return value.bind(modules);
      } else if (value instanceof Object) {
        return new Proxy(value, bindMethodsToModules(modules));
      }
      return Reflect.get(target, prop, receiver);
    },
  };
}

export interface ServiceInterface {
  (this: Modules, ...args: any[]): any;
}

export type Bound<T extends ServiceInterface> = OmitThisParameter<T>;

export default function initServices(
  modules: Modules,
  customServices: Record<string, ServiceInterface> = {},
) {
  const services = {
    bookmarks: {
      migrateBookmarks: migrateBookmarksService as Bound<typeof migrateBookmarksService>,
    },
    files: {
      linkFile: linkFileService as Bound<typeof linkFileService>,
      createSignedURL: createSignedURLService as Bound<typeof createSignedURLService>,
      uploadFileFromURL: uploadFileFromURLService as Bound<typeof uploadFileFromURLService>,
      uploadFileFromStream: uploadFileFromStreamService as Bound<typeof uploadFileFromStreamService>,
      removeFiles: removeFilesService as Bound<typeof removeFilesService>,
      createDownloadStream: createDownloadStreamService as Bound<typeof createDownloadStreamService>,
    },
    orders: {
      registerPaymentCredentials: registerPaymentCredentialsService as Bound<
        typeof registerPaymentCredentialsService
      >,
      calculateDiscountTotal: calculateDiscountTotalService as Bound<
        typeof calculateDiscountTotalService
      >,
      migrateOrderCarts: migrateOrderCartsService as Bound<typeof migrateOrderCartsService>,
      nextUserCart: nextUserCartService as Bound<typeof nextUserCartService>,
      initCartProviders: initCartProvidersService as Bound<typeof initCartProvidersService>,
      updateCalculation: updateCalculationService as Bound<typeof updateCalculationService>,
      supportedDeliveryProviders: supportedDeliveryProvidersService as Bound<
        typeof supportedDeliveryProvidersService
      >,
      supportedPaymentProviders: supportedPaymentProvidersService as Bound<
        typeof supportedPaymentProvidersService
      >,
      supportedWarehousingProviders: supportedWarehousingProvidersService as Bound<
        typeof supportedWarehousingProvidersService
      >,
      processOrder: processOrderService as Bound<typeof processOrderService>,
      checkoutOrder: checkoutOrderService as Bound<typeof checkoutOrderService>,
      confirmOrder: confirmOrderService as Bound<typeof confirmOrderService>,
      rejectOrder: rejectOrderService as Bound<typeof rejectOrderService>,
      discountedEntities: discountedEntitiesService as Bound<typeof discountedEntitiesService>,
      createManualOrderDiscount: createManualOrderDiscountService as Bound<
        typeof createManualOrderDiscountService
      >,
    },
    products: {
      removeProduct: removeProductService as Bound<typeof removeProductService>,
    },
    users: {
      migrateUserData: migrateUserDataService as Bound<typeof migrateUserDataService>,
      updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService as Bound<
        typeof updateUserAvatarAfterUploadService
      >,
      deleteUser: deleteUserService as Bound<typeof deleteUserService>,
    },
    enrollments: {
      createEnrollmentFromCheckout: createEnrollmentFromCheckoutService as Bound<
        typeof createEnrollmentFromCheckoutService
      >,
      processEnrollment: processOrderService as Bound<typeof processOrderService>,
      initializeEnrollment: initializeEnrollmentService as Bound<typeof initializeEnrollmentService>,
      activateEnrollment: activateEnrollmentService as Bound<typeof activateEnrollmentService>,
      terminateEnrollment: terminateEnrollmentService as Bound<typeof terminateEnrollmentService>,
    },
    quotations: {
      fullfillQuotation: fullfillQuotationService as Bound<typeof fullfillQuotationService>,
      processQuotation: processQuotationService as Bound<typeof processQuotationService>,
      proposeQuotation: proposeQuotationService as Bound<typeof proposeQuotationService>,
      rejectQuotation: rejectQuotationService as Bound<typeof rejectQuotationService>,
      verifyQuotation: verifyQuotationService as Bound<typeof verifyQuotationService>,
    },
    filters: {
      searchAssortments: searchAssortmentsService as Bound<typeof searchAssortmentsService>,
      searchProducts: searchProductsService as Bound<typeof searchProductsService>,
      invalidateFilterCache: invalidateFilterCacheService as Bound<typeof invalidateFilterCacheService>,
      loadFilters: loadFiltersService as Bound<typeof loadFiltersService>,
      loadFilterOptions: loadFilterOptionsService as Bound<typeof loadFilterOptionsService>,
    },
    warehousing: {
      ercMetadata: ercMetadataService as Bound<typeof ercMetadataService>,
    },
  };

  // This Proxy Binds all services to the Modules Object
  return new Proxy<typeof services>({ ...services, ...customServices }, bindMethodsToModules(modules));
}

export type Services = ReturnType<typeof initServices>;
