const UNRESTRICTED = 'UNRESTRICTED';

const ROUTE_ROLES: Record<string, string> = {
  '/': UNRESTRICTED,
  '/account': UNRESTRICTED,
  '/account/oauth': UNRESTRICTED,
  '/styleguide': UNRESTRICTED,
  '/products/new': 'manageProducts',
  '/products': 'viewProducts',
  '/filters/new': 'manageFilters',
  '/filters': 'viewFilters',
  '/assortments/new': 'manageAssortments',
  '/assortments': 'viewAssortments',
  '/currency/new': 'manageCurrencies',
  '/currency': 'viewCurrencies',
  '/country/new': 'manageCountries',
  '/country': 'viewCountries',
  '/language/new': 'manageLanguages',
  '/language': 'viewLanguages',
  '/works/management': 'manageWorker',
  '/works': 'viewWorkQueue',
  '/delivery-provider/new': 'manageDeliveryProviders',
  '/delivery-provider': 'manageDeliveryProviders',
  '/payment-provider/new': 'managePaymentProviders',
  '/payment-provider': 'viewPaymentProviders',
  '/warehousing-provider/new': 'manageWarehousingProviders',
  '/warehousing-provider': 'viewWarehousingProviders',
  '/users/new': 'enrollUser',
  '/users': 'viewUsers',
  '/events': 'viewEvents',
  '/orders': 'viewOrders',
  '/quotations': 'viewQuotations',
  '/enrollments': 'viewEnrollments',
  '/tokens': 'viewTokens',
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
  '/500',
  '/external',
  '/ticketing/gate',
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
  if (UNRESTRICTED_PAGES.includes(pathname)) return true;
  if (!user?._id) return false;
  if (user?.isGuest) return false;
  if (pathname.startsWith('/ext/') || pathname === '/ext') {
    return !!user?._id;
  }
  if (!ROUTE_ROLES[pathname]) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[permissionConfig] Unmapped route: "${pathname}" — access denied by default`,
      );
    }
    return false;
  }
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
