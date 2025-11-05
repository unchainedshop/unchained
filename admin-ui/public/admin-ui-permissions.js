window.AdminUiPermissions = () => {

  const ROUTE_ROLES = {
    '/products/new': 'manageProducts',
    '/filters/new': 'manageFilters',
    '/assortments/new': 'manageAssortments',
    '/currency/new': 'manageCurrencies',
    '/country/new': 'manageCountries',
    '/language/new': 'manageLanguages',
    '/works/management': 'manageWorker',
    '/works': 'manageWorker',
    '/works/[workId]': 'manageWorker',
    '/country/[countryId]': 'manageCountries',
    '/currency/[currencyId]': 'manageCurrencies',
    '/language/[languageId]': 'manageLanguages',
    '/products/[...slug]': 'manageProducts',
    '/assortments/[...slug]': 'manageAssortments',
    '/filters/[filterId]': 'manageFilters',
    '/country': 'manageCountries',
    '/currency': 'manageCurrencies',
    '/language': 'manageLanguages',
    '/products': 'viewProducts',
    '/assortments': 'viewAssortments',
    '/filters': 'manageFilters',
    '/delivery-provider/[deliveryProviderId]':
      'manageDeliveryProviders',
    '/delivery-provider':
      'manageDeliveryProviders',
    '/delivery-provider/new':
      'manageDeliveryProviders',
    '/payment-provider/[paymentProviderId]':
      'managePaymentProviders',
    '/payment-provider': 'managePaymentProviders',
    '/payment-provider/new':
      'managePaymentProviders',
    '/warehousing-provider/[warehousingProviderId]':
      'manageWarehousingProviders',
    '/warehousing-provider':
      'manageWarehousingProviders',
    '/warehousing-provider/new':
      'manageWarehousingProviders',
    '/users': 'viewUsers',
    '/users/[userId]': 'manageUsers',
    '/users/new': 'UNRESTRICTED',
    '/events/[eventId]': 'viewEvent',
    '/events': 'viewEvents',
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
    '/orders/[orderId]': 'viewOrders',
    '/orders': 'viewOrders',
    '/quotations': 'viewQuotations',
    '/quotations/[quotationId]': 'viewQuotation',
    '/enrollments': 'viewEnrollments',
    '/enrollments/[enrollmentId]': 'viewEnrollment',
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
      if (user?.isGuest) return false;
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
      console.log('Checking user authentication for user:', user);
      return !!user?._id && !user?.isGuest;
    },
  };
};