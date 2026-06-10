const UNRESTRICTED = 'UNRESTRICTED';

const ROUTE_ROLES: Record<string, string> = {
  '/': UNRESTRICTED,
  '/account': UNRESTRICTED,
  '/account/oauth': UNRESTRICTED,
  '/styleguide': UNRESTRICTED,
  '/products/new': 'manageProducts',
  '/filters/new': 'manageFilters',
  '/assortments/new': 'manageAssortments',
  '/currency/new': 'manageCurrencies',
  '/country/new': 'manageCountries',
  '/language/new': 'manageLanguages',
  '/works/management': 'manageWorker',
  '/works': 'viewWorkQueue',
  '/works/[workId]': 'manageWorker',
  '/country/[countryId]': 'manageCountries',
  '/currency/[currencyId]': 'manageCurrencies',
  '/language/[languageId]': 'manageLanguages',
  '/products/[...slug]': 'manageProducts',
  '/assortments/[...slug]': 'manageAssortments',
  '/filters/[filterId]': 'manageFilters',
  '/country': 'viewCountries',
  '/currency': 'viewCurrencies',
  '/language': 'viewLanguages',
  '/products': 'viewProducts',
  '/assortments': 'viewAssortments',
  '/filters': 'viewFilters',
  '/delivery-provider/[deliveryProviderId]': 'manageDeliveryProviders',
  '/delivery-provider': 'manageDeliveryProviders',
  '/delivery-provider/new': 'manageDeliveryProviders',
  '/payment-provider/[paymentProviderId]': 'managePaymentProviders',
  '/payment-provider': 'viewPaymentProviders',
  '/payment-provider/new': 'managePaymentProviders',
  '/warehousing-provider/[warehousingProviderId]': 'manageWarehousingProviders',
  '/warehousing-provider': 'viewWarehousingProviders',
  '/warehousing-provider/new': 'manageWarehousingProviders',
  '/users': 'viewUsers',
  '/users/[userId]': 'manageUsers',
  '/users/new': 'enrollUser',
  '/events/[eventId]': 'viewEvent',
  '/events': 'viewEvents',
  '/orders/[orderId]': 'viewOrders',
  '/orders': 'viewOrders',
  '/quotations': 'viewQuotations',
  '/quotations/[quotationId]': 'viewQuotation',
  '/enrollments': 'viewEnrollments',
  '/enrollments/[enrollmentId]': 'viewEnrollment',
  '/tokens': 'viewTokens',
  '/tokens/[tokenId]': 'viewToken',
  '/copilot': 'viewProducts',
  '/exports': 'viewWorkQueue',
};

const UNRESTRICTED_PAGES = [
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

const PUBLIC_ONLY_PAGES = [
  '/log-in',
  '/sign-up',
  '/oauth',
  '/account/forgot-password',
  '/reset-password',
  '/install',
];

export const isUserAdmin = (user: {
  allowedActions?: string[];
  roles?: string[];
}) => {
  return (
    user?.allowedActions?.length === 0 || (user?.roles || []).includes('admin')
  );
};

export const checkAccess = (
  user: {
    _id?: string;
    isGuest?: boolean;
    allowedActions?: string[];
    roles?: string[];
  },
  pathname: string,
) => {
  if (!user?._id && !UNRESTRICTED_PAGES.includes(pathname)) return false;
  if (user?.isGuest) return false;
  if (
    ROUTE_ROLES[pathname] === UNRESTRICTED ||
    isUserAdmin(user) ||
    (user?.allowedActions || []).includes(ROUTE_ROLES[pathname])
  )
    return true;
  return false;
};

export const checkRole = (
  user: { allowedActions?: string[]; roles?: string[] },
  role: string,
) => {
  if (isUserAdmin(user)) return true;
  return (user?.allowedActions || []).includes(role);
};

export const isPublicOnlyPage = (pathname: string) => {
  return PUBLIC_ONLY_PAGES.includes(pathname);
};

export const isUserAuthenticated = (user: {
  _id?: string;
  isGuest?: boolean;
}) => {
  return !!user?._id && !user?.isGuest;
};
