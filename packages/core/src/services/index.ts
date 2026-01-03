import type { Modules } from '../modules.ts';
import { migrateUserDataService } from './migrateUserData.ts';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUpload.ts';
import { linkFileService } from './linkFileService.ts';
import { createSignedURLService } from './createSignedURL.ts';
import { uploadFileFromURLService } from './uploadFileFromURL.ts';
import { uploadFileFromStreamService } from './uploadFileFromStream.ts';
import { removeFilesService } from './removeFiles.ts';
import { createDownloadStreamService } from './createDownloadStream.ts';
import { migrateBookmarksService } from './migrateBookmarks.ts';
import { migrateOrderCartsService } from './migrateOrderCart.ts';
import { nextUserCartService } from './nextUserCart.ts';
import { removeProductService } from './removeProduct.ts';
import { initCartProvidersService } from './initCartProviders.ts';
import { updateCalculationService } from './updateCalculation.ts';
import { supportedDeliveryProvidersService } from './supportedDeliveryProviders.ts';
import { deleteUserService } from './deleteUser.ts';
import { supportedPaymentProvidersService } from './supportedPaymentProviders.ts';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.ts';
import { createEnrollmentFromCheckoutService } from './createEnrollmentFromCheckout.ts';
import { searchAssortmentsService } from './searchAssortments.ts';
import {
  searchAssortmentsSimpleService,
  searchAssortmentsSimpleCountService,
} from './searchAssortmentsSimple.ts';
import { searchProductsService } from './searchProducts.ts';
import {
  searchProductsSimpleService,
  searchProductsSimpleCountService,
} from './searchProductsSimple.ts';
import { searchUsersService, searchUsersCountService } from './searchUsers.ts';
import { searchOrdersService } from './searchOrders.ts';
import { searchQuotationsService } from './searchQuotations.ts';
import { searchEnrollmentsService } from './searchEnrollments.ts';
import { searchCountriesService, searchCountriesCountService } from './searchCountries.ts';
import { searchCurrenciesService, searchCurrenciesCountService } from './searchCurrencies.ts';
import { searchLanguagesService, searchLanguagesCountService } from './searchLanguages.ts';
import { searchEventsService, searchEventsCountService } from './searchEvents.ts';
import { searchFiltersService, searchFiltersCountService } from './searchFilters.ts';
import { searchTokensService, searchTokensCountService } from './searchTokens.ts';
import { searchWorkService, searchWorkCountService } from './searchWork.ts';
import {
  searchDeliveryProvidersService,
  searchDeliveryProvidersCountService,
} from './searchDeliveryProviders.ts';
import {
  searchPaymentProvidersService,
  searchPaymentProvidersCountService,
} from './searchPaymentProviders.ts';
import {
  searchWarehousingProvidersService,
  searchWarehousingProvidersCountService,
} from './searchWarehousingProviders.ts';
import { calculateDiscountTotalService } from './calculateDiscountTotal.ts';
import { registerPaymentCredentialsService } from './registerPaymentCredentials.ts';
import { processOrderService } from './processOrder.ts';
import { checkoutOrderService } from './checkoutOrder.ts';
import { confirmOrderService } from './confirmOrder.ts';
import { rejectOrderService } from './rejectOrder.ts';
import { discountedEntitiesService } from './discountedEntities.ts';
import { createManualOrderDiscountService } from './createManualOrderDiscount.ts';
import { initializeEnrollmentService } from './initializeEnrollment.ts';
import { activateEnrollmentService } from './activateEnrollment.ts';
import { terminateEnrollmentService } from './terminateEnrollment.ts';
import { invalidateFilterCacheService } from './invalidateFilterCache.ts';
import { fulfillQuotationService } from './fulfillQuotation.ts';
import { processQuotationService } from './processQuotation.ts';
import { proposeQuotationService } from './proposeQuotation.ts';
import { rejectQuotationService } from './rejectQuotation.ts';
import { verifyQuotationService } from './verifyQuotation.ts';
import { loadFiltersService } from './loadFilters.ts';
import { loadFilterOptionsService } from './loadFilterOptions.ts';
import { removeFilterService } from './removeFilter.ts';
import { removeCartDiscountService } from './removeCartDiscount.ts';
import { addMultipleCartProductsService } from './addMultipleCartProducts.ts';
import { ercMetadataService } from './ercMetadata.ts';
import { simulateProductPricingService } from './simulateProductPricing.ts';
import { simulateProductDispatchingService } from './simulateProductDispatching.ts';
import { simulateProductInventoryService } from './simulateProductInventory.ts';
import { simulateDeliveryPricingService } from './simulateDeliveryPricing.ts';
import { simulatePaymentPricingService } from './simulatePaymentPricing.ts';
import { findOrInitCartService } from './findOrInitCart.ts';
import { addMessageService } from './addMessage.ts';
import { generateOrderFromEnrollmentService } from './generateOrderFromEnrollment.ts';
import { resolveOrderItemDispatchesService } from './resolveOrderItemDispatches.ts';
import { findProductSiblingsService } from './findProductSiblings.ts';
import { simulateConfigurablePriceRangeService } from './simulateConfigurablePriceRange.ts';
import { createFileDownloadURLService } from './createFileDownloadURL.ts';
import { resolveTokenStatusService } from './resolveTokenStatus.ts';
import { isTokenInvalidateableService } from './isTokenInvalidateable.ts';

// Auto-Inject Unchained API as last parameter
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

export type ServiceInterface = (this: Modules, ...args: any[]) => Promise<any> | any;

export type Bound<T extends ServiceInterface> = OmitThisParameter<T>;

export type CustomServices = Record<string, ServiceInterface | Record<string, ServiceInterface>>;

export default function initServices(modules: Modules, customServices: CustomServices = {}) {
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
      createFileDownloadURL: createFileDownloadURLService as Bound<typeof createFileDownloadURLService>,
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
      findOrInitCart: findOrInitCartService as Bound<typeof findOrInitCartService>,
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
      resolveOrderItemDispatches: resolveOrderItemDispatchesService as Bound<
        typeof resolveOrderItemDispatchesService
      >,
      removeCartDiscount: removeCartDiscountService as Bound<typeof removeCartDiscountService>,
      addMultipleCartProducts: addMultipleCartProductsService as Bound<
        typeof addMultipleCartProductsService
      >,
      searchOrders: searchOrdersService as Bound<typeof searchOrdersService>,
    },
    products: {
      simulateProductPricing: simulateProductPricingService as Bound<
        typeof simulateProductPricingService
      >,
      simulateProductDispatching: simulateProductDispatchingService as Bound<
        typeof simulateProductDispatchingService
      >,
      simulateProductInventory: simulateProductInventoryService as Bound<
        typeof simulateProductInventoryService
      >,
      removeProduct: removeProductService as Bound<typeof removeProductService>,
      findProductSiblings: findProductSiblingsService as Bound<typeof findProductSiblingsService>,
      simulateConfigurablePriceRange: simulateConfigurablePriceRangeService as Bound<
        typeof simulateConfigurablePriceRangeService
      >,
    },
    users: {
      migrateUserData: migrateUserDataService as Bound<typeof migrateUserDataService>,
      updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService as Bound<
        typeof updateUserAvatarAfterUploadService
      >,
      deleteUser: deleteUserService as Bound<typeof deleteUserService>,
      searchUsers: searchUsersService as Bound<typeof searchUsersService>,
      searchUsersCount: searchUsersCountService as Bound<typeof searchUsersCountService>,
    },
    enrollments: {
      createEnrollmentFromCheckout: createEnrollmentFromCheckoutService as Bound<
        typeof createEnrollmentFromCheckoutService
      >,
      generateOrderFromEnrollment: generateOrderFromEnrollmentService as Bound<
        typeof generateOrderFromEnrollmentService
      >,
      processEnrollment: processOrderService as Bound<typeof processOrderService>,
      initializeEnrollment: initializeEnrollmentService as Bound<typeof initializeEnrollmentService>,
      activateEnrollment: activateEnrollmentService as Bound<typeof activateEnrollmentService>,
      terminateEnrollment: terminateEnrollmentService as Bound<typeof terminateEnrollmentService>,
      searchEnrollments: searchEnrollmentsService as Bound<typeof searchEnrollmentsService>,
    },
    quotations: {
      fulfillQuotation: fulfillQuotationService as Bound<typeof fulfillQuotationService>,
      processQuotation: processQuotationService as Bound<typeof processQuotationService>,
      proposeQuotation: proposeQuotationService as Bound<typeof proposeQuotationService>,
      rejectQuotation: rejectQuotationService as Bound<typeof rejectQuotationService>,
      verifyQuotation: verifyQuotationService as Bound<typeof verifyQuotationService>,
      searchQuotations: searchQuotationsService as Bound<typeof searchQuotationsService>,
    },
    filters: {
      searchAssortments: searchAssortmentsService as Bound<typeof searchAssortmentsService>,
      searchProducts: searchProductsService as Bound<typeof searchProductsService>,
      searchFilters: searchFiltersService as Bound<typeof searchFiltersService>,
      searchFiltersCount: searchFiltersCountService as Bound<typeof searchFiltersCountService>,
      invalidateFilterCache: invalidateFilterCacheService as Bound<typeof invalidateFilterCacheService>,
      loadFilters: loadFiltersService as Bound<typeof loadFiltersService>,
      loadFilterOptions: loadFilterOptionsService as Bound<typeof loadFilterOptionsService>,
      removeFilter: removeFilterService as Bound<typeof removeFilterService>,
    },
    assortments: {
      searchAssortments: searchAssortmentsSimpleService as Bound<typeof searchAssortmentsSimpleService>,
      searchAssortmentsCount: searchAssortmentsSimpleCountService as Bound<
        typeof searchAssortmentsSimpleCountService
      >,
    },
    productsSimple: {
      searchProducts: searchProductsSimpleService as Bound<typeof searchProductsSimpleService>,
      searchProductsCount: searchProductsSimpleCountService as Bound<
        typeof searchProductsSimpleCountService
      >,
    },
    warehousing: {
      ercMetadata: ercMetadataService as Bound<typeof ercMetadataService>,
      resolveTokenStatus: resolveTokenStatusService as Bound<typeof resolveTokenStatusService>,
      isTokenInvalidateable: isTokenInvalidateableService as Bound<typeof isTokenInvalidateableService>,
      searchTokens: searchTokensService as Bound<typeof searchTokensService>,
      searchTokensCount: searchTokensCountService as Bound<typeof searchTokensCountService>,
      searchWarehousingProviders: searchWarehousingProvidersService as Bound<
        typeof searchWarehousingProvidersService
      >,
      searchWarehousingProvidersCount: searchWarehousingProvidersCountService as Bound<
        typeof searchWarehousingProvidersCountService
      >,
    },
    worker: {
      addMessage: addMessageService as Bound<typeof addMessageService>,
      searchWork: searchWorkService as Bound<typeof searchWorkService>,
      searchWorkCount: searchWorkCountService as Bound<typeof searchWorkCountService>,
    },
    delivery: {
      simulateDeliveryPricing: simulateDeliveryPricingService as Bound<
        typeof simulateDeliveryPricingService
      >,
      searchDeliveryProviders: searchDeliveryProvidersService as Bound<
        typeof searchDeliveryProvidersService
      >,
      searchDeliveryProvidersCount: searchDeliveryProvidersCountService as Bound<
        typeof searchDeliveryProvidersCountService
      >,
    },
    payment: {
      simulatePaymentPricing: simulatePaymentPricingService as Bound<
        typeof simulatePaymentPricingService
      >,
      searchPaymentProviders: searchPaymentProvidersService as Bound<
        typeof searchPaymentProvidersService
      >,
      searchPaymentProvidersCount: searchPaymentProvidersCountService as Bound<
        typeof searchPaymentProvidersCountService
      >,
    },
    countries: {
      searchCountries: searchCountriesService as Bound<typeof searchCountriesService>,
      searchCountriesCount: searchCountriesCountService as Bound<typeof searchCountriesCountService>,
    },
    currencies: {
      searchCurrencies: searchCurrenciesService as Bound<typeof searchCurrenciesService>,
      searchCurrenciesCount: searchCurrenciesCountService as Bound<typeof searchCurrenciesCountService>,
    },
    languages: {
      searchLanguages: searchLanguagesService as Bound<typeof searchLanguagesService>,
      searchLanguagesCount: searchLanguagesCountService as Bound<typeof searchLanguagesCountService>,
    },
    events: {
      searchEvents: searchEventsService as Bound<typeof searchEventsService>,
      searchEventsCount: searchEventsCountService as Bound<typeof searchEventsCountService>,
    },
  };

  // This Proxy Binds all services to the Modules Object
  return new Proxy<typeof services>({ ...services, ...customServices }, bindMethodsToModules(modules));
}

export type Services = ReturnType<typeof initServices>;
