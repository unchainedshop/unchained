module.exports = () => {
  const ACTION_ROLES = {
    assortments: {
      showAssortment: 'viewAssortment',
      showAssortments: 'viewAssortments',
      addAssortment: 'manageAssortments',
      editAssortment: 'manageAssortments',
      removeAssortment: 'manageAssortments',
      setAssortmentAsBase: 'manageAssortments',
      addAssortmentMedia: 'manageAssortments',
      removeAssortmentMedia: 'manageAssortments',
      manageAssortments: 'manageAssortments',
      editAssortmentMediaText: 'manageAssortments',
      editAssortmentText: 'manageAssortments',
      reorderAssortmentMedia: 'manageAssortments',
      addAssortmentProduct: 'manageAssortments',
      removeAssortmentProduct: 'manageAssortments',
      reorderAssortmentProduct: 'manageAssortments',
      addAssortmentLink: 'manageAssortments',
      removeAssortmentLink: 'manageAssortments',
      reorderAssortmentLink: 'manageAssortments',
      addAssortmentFilter: 'manageAssortments',
      removeAssortmentFilter: 'manageAssortments',
      reorderAssortmentFilter: 'manageAssortments',
    },
    tokens: {
      showTokens: 'viewTokens',
      showToken: 'viewToken',
      editToken: 'updateToken',
    },
    products: {
      showProduct: 'viewProduct',
      showProducts: 'viewProducts',
      addProduct: 'manageProducts',
      editProduct: 'manageProducts',
      removeProduct: 'manageProducts',
      manageProducts: 'manageProducts',
      addProductMedia: 'manageProducts',
      removeProductMedia: 'manageProducts',
      reorderProductMedia: 'manageProducts',
      editProductMediaTexts: 'manageProducts',
      publishProduct: 'manageProducts',
      unpublishProduct: 'manageProducts',
      editProductTexts: 'manageProducts',
      editProductSupply: 'manageProducts',
      editProductCommerce: 'manageProducts',
      editProductWarehousing: 'manageProducts',
      editProductPlan: 'manageProducts',
      addProductVariation: 'manageProducts',
      removeProductVariation: 'manageProducts',
      editProductVariationTexts: 'manageProducts',
      addProductVariationOption: 'manageProducts',
      removeProductVariationOptions: 'manageProducts',
      addProductBundleItem: 'manageProducts',
      removeProductBundleItem: 'manageProducts',
      addProductAssignment: 'manageProducts',
      removeProductAssignment: 'manageProducts',
    },
    quotations: {
      showQuotation: 'viewQuotation',
      showQuotations: 'viewQuotations',
      markQuotationAsPaid: 'markOrderPaid',
      markQuotationAsDelivered: 'markOrderDelivered',
    },

    filters: {
      showFilter: 'viewFilter',
      showFilters: 'viewFilters',
      addFilter: 'manageFilters',
      editFilter: 'manageFilters',
      removeFilter: 'manageFilters',
      manageFilters: 'manageFilters',
      editFilterTexts: 'manageFilters',
      addFilterOption: 'manageFilters',
      removeFilters: 'manageFilters',
    },
    currencies: {
      showCurrency: 'viewCurrency',
      showCurrencies: 'viewCurrencies',
      addCurrency: 'manageCurrencies',
      manageCurrencies: 'manageCurrencies',
      editCurrency: 'manageCurrencies',
      removeCurrency: 'manageCurrencies',
    },
    country: {
      showCountry: 'viewCountry',
      showCountries: 'viewCountries',
      addCountry: 'manageCountries',
      manageCountries: 'manageCountries',
      editCountry: 'manageCountries',
      removeCountry: 'manageCountries',
    },
    languages: {
      showLanguage: 'viewLanguage',
      showLanguages: 'viewLanguages',
      addLanguage: 'manageLanguages',
      editLanguage: 'manageLanguages',
      removeLanguage: 'manageLanguages',
      manageLanguages: 'manageLanguages',
    },
    deliveryProviders: {
      showDeliveryProvider: 'viewDeliveryProvider',
      showDeliveryProviders: 'viewDeliveryProviders',
      addDeliveryProvider: 'manageDeliveryProviders',
      editDeliveryProvider: 'manageDeliveryProviders',
      manageDeliveryProviders: 'manageDeliveryProviders',
      removeDeliveryProvider: 'manageDeliveryProviders',
    },
    paymentProviders: {
      showPaymentProvider: 'viewPaymentProvider',
      showPaymentProviders: 'viewPaymentProviders',
      addPaymentProvider: 'managePaymentProviders',
      editPaymentProvider: 'managePaymentProviders',
      removePaymentProvider: 'managePaymentProviders',
      managePaymentProviders: 'managePaymentProviders',
    },
    warehousingProviders: {
      showWarehousingProvider: 'viewWarehousingProvider',
      showWarehousingProviders: 'viewWarehousingProviders',
      addWarehousingProvider: 'manageWarehousingProviders',
      editWarehousingProvider: 'manageWarehousingProviders',
      manageWarehousingProviders: 'manageWarehousingProviders',
      removeWarehousingProvider: 'manageWarehousingProviders',
    },
    work: {
      showWork: 'manageWorker',
      showWorkQueue: 'manageWorker',
      manageWorker: 'manageWorker',
      addWork: 'manageWorker',
      allocateWork: 'manageWorker',
      finishWork: 'manageWorker',
      removeWork: 'manageWorker',
    },
    orders: {
      showOrder: 'viewOrder',
      showOrders: 'viewOrders',
      removeOrder: 'updateOrder',
      manageOrders: 'updateOrder',
      confirmOrder: 'markOrderConfirmed',
      rejectOrder: 'markOrderRejected',
      manualPayOrder: 'markOrderPaid',
      manualDeliverOrder: 'markOrderDelivered',
    },
    users: {
      showUser: 'viewUser',
      showUsers: 'viewUsers',
      editUserEmails: 'updateUser',
      addUserEmail: 'updateUser',
      removeUserEmail: 'updateUser',
      editUserAvatar: 'updateUser',
      addUser: 'manageUsers',
      editUserTags: 'manageUsers',
      editUserProfile: 'updateUser',
      editUserPassword: 'manageUsers',
      showUserPassword: 'manageUsers',
      editUsername: 'manageUsers',
      editUserRoles: 'manageUsers',
      showUserRoles: 'manageUsers',
      editUser: 'manageUsers',
      showTwoFactor: 'manageUsers',
      manageUsers: 'manageUsers',
      enrollUser: 'manageUsers',
      showWebAuthn: 'manageUsers',
      removeUser: 'removeUser',
    },
    shopInfo: {
      viewShopInfo: 'viewShopInfo',
    },
    enrollment: {
      showEnrollment: 'viewEnrollment',
      showEnrollments: 'viewEnrollments',
      addEnrollment: 'createEnrollment',
      editEnrollment: 'updateEnrollment',
      terminateEnrollment: 'terminateEnrollment',
    },
    events: {
      showEvent: 'viewEvent',
      showEvents: 'viewEvents',
    },
  };

  const ROUTE_ROLES = {
    '/products/new': ACTION_ROLES.products.manageProducts,
    '/filters/new': ACTION_ROLES.filters.manageFilters,
    '/assortments/new': ACTION_ROLES.assortments.manageAssortments,
    '/currency/new': ACTION_ROLES.currencies.manageCurrencies,
    '/country/new': ACTION_ROLES.country.manageCountries,
    '/language/new': ACTION_ROLES.languages.manageLanguages,
    '/works/management': ACTION_ROLES.work.manageWorker,
    '/works': ACTION_ROLES.work.manageWorker,
    '/works/[workId]': ACTION_ROLES.work.manageWorker,
    '/country/[countryId]': ACTION_ROLES.country.manageCountries,
    '/currency/[currencyId]': ACTION_ROLES.currencies.manageCurrencies,
    '/language/[languageId]': ACTION_ROLES.languages.manageLanguages,
    '/products/[...slug]': ACTION_ROLES.products.manageProducts,
    '/assortments/[...slug]': ACTION_ROLES.assortments.manageAssortments,
    '/filters/[filterId]': ACTION_ROLES.filters.manageFilters,
    '/country': ACTION_ROLES.country.manageCountries,
    '/currency': ACTION_ROLES.currencies.manageCurrencies,
    '/language': ACTION_ROLES.languages.manageLanguages,
    '/products': ACTION_ROLES.products.manageProducts,
    '/assortments': ACTION_ROLES.assortments.manageAssortments,
    '/filters': ACTION_ROLES.filters.manageFilters,
    '/delivery-provider/[deliveryProviderId]':
      ACTION_ROLES.deliveryProviders.manageDeliveryProviders,
    '/delivery-provider':
      ACTION_ROLES.deliveryProviders.manageDeliveryProviders,
    '/delivery-provider/new':
      ACTION_ROLES.deliveryProviders.manageDeliveryProviders,
    '/payment-provider/[paymentProviderId]':
      ACTION_ROLES.paymentProviders.managePaymentProviders,
    '/payment-provider': ACTION_ROLES.paymentProviders.managePaymentProviders,
    '/payment-provider/new':
      ACTION_ROLES.paymentProviders.managePaymentProviders,
    '/warehousing-provider/[warehousingProviderId]':
      ACTION_ROLES.warehousingProviders.manageWarehousingProviders,
    '/warehousing-provider':
      ACTION_ROLES.warehousingProviders.manageWarehousingProviders,
    '/warehousing-provider/new':
      ACTION_ROLES.warehousingProviders.manageWarehousingProviders,
    '/users': ACTION_ROLES.users.manageUsers,
    '/users/[userId]': ACTION_ROLES.users.manageUsers,
    '/users/new': 'UNRESTRICTED',
    '/events/[eventId]': ACTION_ROLES.events.showEvent,
    '/events': ACTION_ROLES.events.showEvents,
    '/': 'UNRESTRICTED',
    '/account': 'UNRESTRICTED',
    '/account/oauth': 'UNRESTRICTED',
    '/log-in': 'UNRESTRICTED',
    '/account/forgot-password': 'UNRESTRICTED',
    '/reset-password': 'UNRESTRICTED',
    '/sign-up': 'UNRESTRICTED',
    '/404': 'UNRESTRICTED',
    '/_offline': 'UNRESTRICTED',
    '/403': 'UNRESTRICTED',
    '/423': 'UNRESTRICTED',
    '/verify-email': 'UNRESTRICTED',
    '/oauth': 'UNRESTRICTED',
    '/external': 'UNRESTRICTED',
    '/orders/[orderId]': ACTION_ROLES.orders.manageOrders,
    '/orders': ACTION_ROLES.orders.manageOrders,
    '/quotations': ACTION_ROLES.quotations.showQuotations,
    '/quotations/[quotationId]': ACTION_ROLES.quotations.showQuotation,
    '/enrollments': ACTION_ROLES.enrollment.showEnrollments,
    '/enrollments/[enrollmentId]': ACTION_ROLES.enrollment.showEnrollment,
  };
  const UnrestrictedPages = [
    '/install',
    '/log-in',
    '/sign-up',
    '/oauth',
    '/account/forgot-password',
    '/reset-password',
    '/graphql',
    '/404',
    '/423',
    '/_offline',
    '/verify-email',
    '/403',
    '/external',
  ];

  const OnlyPublicPages = [
    '/log-in',
    '/sign-up',
    '/oauth',
    '/account/forgot-password',
    '/reset-password',    
    '/install',
  ];

  const isAdmin = (user) => {
    return (
      user?.allowedActions.length === 0 || (user?.roles || []).includes('admin')
    );
  };

  return {
    UnrestrictedPages,
    checkAccess: (user, pathname) => {
      if (!user?._id && !UnrestrictedPages?.includes(pathname)) return false;

      if (
        ROUTE_ROLES[pathname] === 'UNRESTRICTED' ||
        isAdmin(user) ||
        (user?.allowedActions || [])?.includes(ROUTE_ROLES[pathname])
      )
        return true;
      return false;
    },
    checkRole: (user, role) => {
      if (isAdmin(user)) {
        return true;
      }
      if (user?.allowedActions.includes(role)) {
        return true;
      }
      return false;
    },
    isUserAdmin: isAdmin,
    isPublicOnlyPage: (pathname) => {
      return OnlyPublicPages.includes(pathname);
    },
    isUserAuthenticated: (user) => {
      return !!user?._id;
    },
  };
};
