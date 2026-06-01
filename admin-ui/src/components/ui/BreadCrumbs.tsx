import Link from 'next/link';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

const BreadCrumbs = ({
  routeName = null,
  currentPageTitle = null,
  depth = null,
}) => {
  const router = useRouter();
  const { formatMessage } = useIntl();

  // Mapping of route segments to translation keys
  const routeTranslations = {
    home: 'home',
    products: 'products',
    orders: 'orders',
    users: 'users',
    assortments: 'assortments',
    filters: 'filters',
    tokens: 'tokens',
    quotations: 'quotations',
    enrollments: 'enrollments',
    activities: 'activities',
    works: 'work_queue',
    events: 'events',
    currency: 'currencies',
    country: 'countries',
    language: 'languages',
    'delivery-provider': 'delivery_providers',
    'payment-provider': 'payment_providers',
    'warehousing-provider': 'warehousing_provider',
    system: 'system',
    account: 'account',
    new: 'new',
    edit: 'edit',
  };
  const pathArr = router.asPath

    ?.split('/')
    ?.filter((name, i) => router.asPath?.split('/')?.indexOf(name) === i);
  if (pathArr.length === 1) return null;

  let currentRoute = '';
  // location of the page, used when supporting  non-url safe urls that may have / in them to tell it where the page is located on the page hierarchy
  if (depth) pathArr.splice(depth);
  // if current page name is provided use it as the last item of breadcrumb
  if (routeName) pathArr[pathArr.length - 1] = routeName;

  const result = pathArr?.map((e) => {
    currentRoute += `${e}/`;
    if (!e) {
      return {
        name: formatMessage({ id: 'home', defaultMessage: 'Home' }),
        path: '/',
      };
    }
    // if routeName is given dont modify the string else
    // remove hyphens incase it hyphen deliminated slug
    const pathSegment = e?.split('?')[0];
    const pathName = routeName ? pathSegment : pathSegment.replace(/-/g, ' ');

    // Try to get translation for this route segment
    const translationKey = routeTranslations[pathSegment];
    const translatedName = translationKey
      ? formatMessage({ id: translationKey, defaultMessage: pathName })
      : decodeURIComponent(pathName);

    return {
      name: translatedName,
      path: currentRoute.replace(/.$/, ''),
    };
  });
  return (
    <nav
      className="mb-5 hidden sm:flex lg:mt-5 lg:mb-8"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-4">
        {result?.map((data, i) => (
          <li key={data.path}>
            <div className="flex items-center">
              {i !== 0 && (
                <svg
                  className="mr-4 h-5 w-5 shrink-0 text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <Link
                href={data.path}
                className="text-sm font-medium capitalize text-slate-500 dark:text-slate-400 dark:hover:text-slate-300 hover:text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-800 rounded-md px-1 py-1"
              >
                {i === result.length - 1 && currentPageTitle
                  ? currentPageTitle
                  : data.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default BreadCrumbs;
