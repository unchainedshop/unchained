import {
  Cog8ToothIcon,
  HomeModernIcon,
  InboxStackIcon,
  RectangleStackIcon,
  CalendarIcon,
  UsersIcon,
  UserIcon,
  Bars4Icon,
  AdjustmentsHorizontalIcon,
  CommandLineIcon,
  BoltIcon,
  LinkIcon,
  QrCodeIcon,
  CubeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import useCurrentUser from '../../accounts/hooks/useCurrentUser';
import useShopInfo from '../hooks/useShopInfo';
import SideNav from './SideNav';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import useOutsideClick from '../hooks/useOutsideClick';
import ImageWithFallback from './ImageWithFallback';
import AuthWrapper from '../../Auth/AuthWrapper';
import formatUsername from '../utils/formatUsername';
import { useApolloClient } from '@apollo/client/react';
import { toast } from 'react-toastify';
import logOut from '../../accounts/hooks/logOut';
import { useRouter } from 'next/router';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import useApp from '../hooks/useApp';
import useShopConfiguration from '../hooks/useShopConfiguration';

const QuotationIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
    stroke="currentColor"
    viewBox="0 0 512 423.85"
  >
    <path d="M88.47 0c8.93 0 17.04 3.63 22.89 9.48 2.73 2.74 4.98 5.95 6.6 9.52h52.71c1.62-3.56 3.87-6.78 6.59-9.51C183.12 3.64 191.22 0 200.16 0c8.93 0 17.04 3.64 22.89 9.48 2.73 2.74 4.98 5.96 6.6 9.52h52.71c1.62-3.56 3.87-6.78 6.6-9.51C294.82 3.64 302.92 0 311.85 0c8.94 0 17.04 3.64 22.89 9.48 2.74 2.74 4.98 5.96 6.6 9.52h52.7c1.62-3.56 3.87-6.78 6.59-9.51C406.49 3.64 414.6 0 423.54 0c8.93 0 17.03 3.64 22.88 9.48 2.73 2.74 4.98 5.96 6.6 9.52h45.6c7.39 0 13.38 5.99 13.38 13.38v337.51c-.03 5.09-2.96 9.95-7.89 12.17-61.54 27.94-154.45 41.79-247.16 41.79-92.63 0-185.76-13.85-247.89-41.29-5.27-1.8-9.06-6.79-9.06-12.67V32.38C0 24.99 5.99 19 13.37 19h45.61c1.62-3.56 3.87-6.78 6.6-9.51C71.44 3.64 79.54 0 88.47 0zm127.99 277.29c8.08 0 14.63 6.56 14.63 14.63s-6.55 14.63-14.63 14.63c-8.07 0-14.62-6.56-14.62-14.63s6.55-14.63 14.62-14.63zm0-71.59c8.08 0 14.63 6.54 14.63 14.62 0 8.08-6.55 14.63-14.63 14.63-8.07 0-14.62-6.55-14.62-14.63 0-8.08 6.55-14.62 14.62-14.62zm0-70.86c8.08 0 14.63 6.56 14.63 14.63s-6.55 14.63-14.63 14.63c-8.07 0-14.62-6.56-14.62-14.63s6.55-14.63 14.62-14.63zM372.27 278.9c7.19 0 13.02 5.83 13.02 13.02 0 7.19-5.83 13.02-13.02 13.02H264.7c-7.19 0-13.02-5.83-13.02-13.02 0-7.19 5.83-13.02 13.02-13.02h107.57zm57.88-71.61c7.19 0 13.02 5.84 13.02 13.03 0 7.19-5.83 13.02-13.02 13.02H264.7c-7.19 0-13.02-5.83-13.02-13.02 0-7.19 5.83-13.03 13.02-13.03h165.45zm5.03-70.84c7.19 0 13.03 5.83 13.03 13.02 0 7.19-5.84 13.02-13.03 13.02H264.7c-7.19 0-13.02-5.83-13.02-13.02 0-7.19 5.83-13.02 13.02-13.02h170.48zM107.71 293.97c-9.17-.65-20.85-2.9-29.84-5.32v-32.04l9.06.74c11.7.69 27.58 1.92 39.06.89 2.23-.2 4.83-.58 6.86-1.57 3.86-1.85 3.81-15 1.26-16.81-1.47-1.04-3.14-1.44-4.92-1.44h-9.35c-7.05 0-13.29-.79-18.73-2.37-5.54-1.61-10.21-4.03-14.02-7.26-3.89-3.32-6.8-7.71-8.72-13.18-1.85-5.32-2.8-11.65-2.8-18.99v-12.21c0-6.8 1.04-12.78 3.11-17.94 3.44-8.55 10.58-15.4 18.87-19.29 2.9-1.36 6.15-2.39 10.16-3.06v-14.21h29.54v13.65c4.89.38 8.68 1.06 13.47 1.93 5.48.95 10.79 2.03 16.2 3.34v32.09l-2.85-.25a422.93 422.93 0 0 0-36.47-1.58c-3.54 0-10.29.09-12.96 2.76-2.19 2.18-1.87 15.23.49 17.16 1.78 1.44 4.81 1.69 6.99 1.69h11.65c7.5 0 15.26 1.28 21.84 5.03 5.93 3.37 10.4 7.97 13.39 13.77 1.47 2.86 2.59 5.93 3.33 9.21 1.62 7.15 1.12 15.14 1.12 22.48 0 5.74-.52 10.86-1.53 15.33-1.04 4.57-2.63 8.47-4.74 11.68-6.6 10.01-18.44 14.36-29.93 15.62v15.39h-29.54v-15.24zm10.25-248.22a32.507 32.507 0 0 1-6.6 9.51c-5.86 5.86-13.96 9.5-22.89 9.5s-17.04-3.64-22.89-9.5a32.245 32.245 0 0 1-6.6-9.51H26.75v315.36c58.52 23.93 144.27 35.99 230.2 35.99 85.36 0 170.32-11.92 228.3-35.96V45.75h-32.23a32.507 32.507 0 0 1-6.6 9.51c-5.86 5.86-13.97 9.5-22.88 9.5-8.94 0-17.04-3.64-22.89-9.49a32.452 32.452 0 0 1-6.61-9.52h-52.7a32.234 32.234 0 0 1-6.6 9.52c-5.86 5.85-13.96 9.49-22.89 9.49s-17.04-3.64-22.89-9.5a32.245 32.245 0 0 1-6.6-9.51h-52.71a32.422 32.422 0 0 1-6.6 9.52c-5.86 5.85-13.96 9.49-22.89 9.49-8.94 0-17.04-3.64-22.9-9.5a32.402 32.402 0 0 1-6.59-9.51h-52.71z" />
  </svg>
);

const Layout = ({
  children,
  pageHeader = '',
  componentName,
  /* navigationType = 'default', */
}) => {
  const { isSystemReady } = useApp();
  const { formatMessage } = useIntl();
  const { currentUser } = useCurrentUser();
  const { configuration } = useShopConfiguration();

  const { shopInfo } = useShopInfo();
  const [hideNav, setHideNav] = useState(true);
  const [narrowNav, setNarrowNav] = useState(false);
  const apolloClient = useApolloClient();
  const router = useRouter();

  const handleClickOutside = () => {
    setHideNav(true);
  };

  const ref = useOutsideClick(handleClickOutside);

  const onLogout = async () => {
    const userName =
      currentUser?.username ||
      currentUser?.profile?.displayName ||
      currentUser?.name ||
      '';
    await logOut(apolloClient, router);
    toast.success(
      formatMessage(
        {
          id: 'goodbye_user',
          defaultMessage: 'See you later, {name}!',
        },
        { name: userName },
      ),
    );
  };

  const conditionalDashboardTitle = configuration.isFullyConfigured
    ? formatMessage({ id: 'dashboard', defaultMessage: 'Dashboard' })
    : formatMessage({
        id: 'complete_system_setup',
        defaultMessage: 'Complete Setup',
      });

  const defaultNavigation = [
    {
      name: conditionalDashboardTitle,
      icon: HomeModernIcon,
      href: '/',
    },
    isSystemReady && {
      name: formatMessage({ id: 'copilot', defaultMessage: 'Copilot' }),
      requiredRole: (user) => user?.roles?.includes('admin'),
      icon: CommandLineIcon,
      href: '/copilot',
    },
    isSystemReady && {
      name: formatMessage({
        id: 'orders',
        defaultMessage: 'Orders',
      }),
      requiredRole: 'viewOrders',
      icon: InboxStackIcon,
      href: '/orders',
    },
    isSystemReady && {
      name: formatMessage({
        id: 'products',
        defaultMessage: 'Products',
      }),
      requiredRole: 'viewProducts',
      icon: CubeIcon,
      href: '/products',
    },
    isSystemReady && {
      name: formatMessage({ id: 'assortments', defaultMessage: 'Assortments' }),
      icon: RectangleStackIcon,
      href: '/assortments',
      requiredRole: 'viewAssortments',
    },
    isSystemReady && {
      name: formatMessage({ id: 'filters', defaultMessage: 'Filters' }),
      icon: AdjustmentsHorizontalIcon,
      requiredRole: 'viewFilters',
      href: '/filters',
    },
    isSystemReady && {
      name: formatMessage({ id: 'users', defaultMessage: 'Users' }),
      icon: UsersIcon,
      href: '/users',
      requiredRole: 'viewUsers',
    },
    isSystemReady && {
      name: formatMessage({
        id: 'enrollments',
        defaultMessage: 'Enrollments',
      }),

      href: '/enrollments',
      requiredRole: 'viewEnrollments',
      icon: CalendarIcon,
    },
    isSystemReady && {
      name: formatMessage({
        id: 'quotations',
        defaultMessage: 'Quotations',
      }),
      href: '/quotations',
      icon: QuotationIcon,
      requiredRole: 'viewQuotations',
    },
    isSystemReady && {
      name: formatMessage({ id: 'tokens', defaultMessage: 'Tokens' }),
      icon: QrCodeIcon,
      href: '/tokens',
      requiredRole: 'viewTokens',
    },
    {
      name: formatMessage({ id: 'system', defaultMessage: 'System settings' }),
      icon: Cog8ToothIcon,
      children: [
        {
          name: formatMessage({
            id: 'currencies',
            defaultMessage: 'Currencies',
          }),
          requiredRole: 'viewCurrencies',
          href: '/currency',
        },
        {
          name: formatMessage({ id: 'countries', defaultMessage: 'Countries' }),
          href: '/country',
          requiredRole: 'viewCountries',
        },
        {
          name: formatMessage({ id: 'languages', defaultMessage: 'Languages' }),
          href: '/language',
          requiredRole: 'viewLanguages',
        },
        isSystemReady && {
          name: formatMessage({
            id: 'delivery_providers',
            defaultMessage: 'Delivery providers',
          }),
          requiredRole: 'viewDeliveryProviders',
          href: '/delivery-provider',
        },
        isSystemReady && {
          name: formatMessage({
            id: 'payment_providers',
            defaultMessage: 'Payment providers',
          }),
          requiredRole: 'viewPaymentProviders',
          href: '/payment-provider',
        },
        isSystemReady && {
          name: formatMessage({
            id: 'warehousing_provider',
            defaultMessage: 'Warehousing provider',
          }),
          requiredRole: 'viewWarehousingProviders',
          href: '/warehousing-provider',
        },
      ].filter(Boolean),
    },
    {
      name: formatMessage({ id: 'activities', defaultMessage: 'Activities' }),
      icon: BoltIcon,
      children: [
        {
          name: formatMessage({
            id: 'work_queue',
            defaultMessage: 'Work queue',
          }),
          requiredRole: 'viewWorkQueue',
          href: '/works',
        },
        {
          name: formatMessage({ id: 'event', defaultMessage: 'Events' }),
          href: '/events',
          requiredRole: 'showEvents',
        },
      ],
    },
    shopInfo?.adminUiConfig?.externalLinks?.length && {
      name: formatMessage({ id: 'extensions', defaultMessage: 'Extensions' }),
      icon: LinkIcon,
      href: '/',
      children: shopInfo.adminUiConfig.externalLinks?.map((link) => {
        let normalizedHref = link.href;
        if (link?.target === 'SELF')
          normalizedHref = `/external?url=${link.href}`;

        return {
          name: link.title,
          href: normalizedHref,
        };
      }),
    },
  ].filter(Boolean);

  return (
    <AuthWrapper>
      <div
        className={`fixed inset-0 z-40 flex md:hidden  ${
          hideNav ? 'hidden' : ''
        } `}
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 backdrop-blur-sm" aria-hidden="true" />

        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-slate-900 shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              id="close_sidebar"
              type="button"
              onClick={() => setHideNav(!hideNav)}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white dark:focus:ring-slate-400"
            >
              <span className="sr-only">
                {formatMessage({
                  id: 'close_sidebar',
                  defaultMessage: 'Close sidebar',
                })}
              </span>

              <svg
                className="h-6 w-6 text-slate-800 dark:text-slate-200"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
            <div className="flex shrink-0 items-center px-2 lg:px-4 2xl:px-6">
              <Link
                href="/"
                className="focus:outline-hidden focus:ring-2 focus:ring-slate-800 rounded-md p-1"
              >
                <div className="dark:brightness-0 dark:invert">
                  <ImageWithFallback
                    src={process.env.NEXT_PUBLIC_LOGO}
                    width={41}
                    height={25}
                    alt={formatMessage({
                      id: 'unchained_logo',
                      defaultMessage: 'Unchained Logo',
                    })}
                  />
                </div>
              </Link>
            </div>
            <SideNav
              navigation={defaultNavigation}
              onClick={() => setHideNav(!hideNav)}
            />
          </div>
          <div className="flex items-center shrink-0 border-t border-slate-300 dark:border-slate-800 px-2 py-2">
            <Link
              href="/account"
              className="flex items-center flex-1 py-2 pr-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-800"
            >
              {currentUser?.avatar ? (
                <ImageWithFallback
                  src={currentUser.avatar.url}
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 mr-2 rounded-full object-cover"
                  alt={formatMessage({
                    id: 'user_avatar',
                    defaultMessage: 'User avatar',
                  })}
                />
              ) : (
                <UserIcon className="h-8 w-8 shrink-0 mr-2 text-slate-800 dark:text-slate-300" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium dark:text-slate-400">
                  {formatMessage({ id: 'account', defaultMessage: 'Account' })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {formatUsername(currentUser)}
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-2 ml-auto">
              <button
                onClick={onLogout}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
                title={formatMessage({
                  id: 'log_out',
                  defaultMessage: 'Log out',
                })}
              >
                <ArrowRightEndOnRectangleIcon className="h-5 w-5" />
              </button>
              <Link
                href="https://docs.unchained.shop/src/docs/admin-ui/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
                title={formatMessage({
                  id: 'documentation',
                  defaultMessage: 'Documentation',
                })}
              >
                <DocumentTextIcon className="h-5 w-5" />
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col dark:bg-slate-900 dark:text-slate-200 ${narrowNav ? 'md:w-16' : 'md:w-64 2xl:w-96'}`}
      >
        <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hide pt-10">
            <div
              className={`flex shrink-0 items-center ${narrowNav ? 'px-2 justify-center' : 'px-2 lg:px-4 2xl:px-6'}`}
            >
              <Link
                href="/"
                className="focus:outline-hidden focus:ring-2 focus:ring-slate-800 rounded-md p-1"
              >
                <div className="dark:brightness-0 dark:invert">
                  <ImageWithFallback
                    src={process.env.NEXT_PUBLIC_LOGO}
                    width={narrowNav ? 25 : 41}
                    height={25}
                    alt={formatMessage({
                      id: 'unchained_logo',
                      defaultMessage: 'Unchained Logo',
                    })}
                  />
                </div>
              </Link>
            </div>
            <SideNav navigation={defaultNavigation} narrowView={narrowNav} />
          </div>
          <div
            className={`flex items-center shrink-0 py-2 ${narrowNav ? 'justify-center px-2' : 'border-t border-slate-200 dark:border-slate-800 px-2 lg:px-4 2xl:px-6'}`}
          >
            {!narrowNav && (
              <>
                <Link
                  href="/account"
                  className="flex items-center flex-1 py-2 pr-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-800"
                >
                  {currentUser?.avatar ? (
                    <ImageWithFallback
                      src={currentUser.avatar.url}
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 mr-3 rounded-full object-cover"
                      alt={formatMessage({
                        id: 'user_avatar',
                        defaultMessage: 'User avatar',
                      })}
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 shrink-0 mr-3 text-slate-800 dark:text-slate-300" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium dark:text-slate-400">
                      {formatMessage({
                        id: 'account',
                        defaultMessage: 'Account',
                      })}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatUsername(currentUser)}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={onLogout}
                  className="p-2 mr-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800 ml-auto"
                  title={formatMessage({
                    id: 'log_out',
                    defaultMessage: 'Log out',
                  })}
                >
                  <ArrowRightEndOnRectangleIcon className="h-5 w-5" />
                </button>
              </>
            )}
            {narrowNav && (
              <div className="flex items-center flex-col space-y-2">
                <Link
                  href="/account"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400"
                  title={formatMessage({
                    id: 'account',
                    defaultMessage: 'Account',
                  })}
                >
                  {currentUser?.avatar ? (
                    <ImageWithFallback
                      src={currentUser.avatar.url}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                      alt={formatMessage({
                        id: 'user_avatar',
                        defaultMessage: 'User avatar',
                      })}
                    />
                  ) : (
                    <UserIcon className="h-6 w-6" />
                  )}
                </Link>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400"
                  title={formatMessage({
                    id: 'log_out',
                    defaultMessage: 'Log out',
                  })}
                >
                  <ArrowRightEndOnRectangleIcon className="h-5 w-5" />
                </button>
                <LanguageToggle narrowNav={narrowNav} />
                <Link
                  href="https://docs.unchained.shop/src/docs/admin-ui/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400"
                  title={formatMessage({
                    id: 'documentation',
                    defaultMessage: 'Documentation',
                  })}
                >
                  <DocumentTextIcon className="h-5 w-5" />
                </Link>
                <ThemeToggle />
              </div>
            )}
          </div>
          <div
            className={`flex shrink-0 p-2 ${narrowNav ? '' : 'border-t border-slate-200 dark:border-slate-800'}`}
          >
            {narrowNav ? (
              <button
                onClick={() => setNarrowNav(!narrowNav)}
                className="w-full flex items-center justify-center p-2 text-slate-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
                title={formatMessage({
                  id: 'expand_navigation',
                  defaultMessage: 'Expand navigation',
                })}
              >
                <Bars4Icon className="h-6 w-6 transition-transform" />
              </button>
            ) : (
              <div className="w-full flex items-center justify-center">
                <button
                  onClick={() => setNarrowNav(!narrowNav)}
                  className="flex items-center p-2 text-slate-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
                  title={formatMessage({
                    id: 'collapse_navigation',
                    defaultMessage: 'Collapse navigation',
                  })}
                >
                  <Bars4Icon className="h-6 w-6 rotate-90 transition-transform" />
                </button>
                <div className="ml-2 flex items-center space-x-2">
                  <LanguageToggle narrowNav={narrowNav} />
                  <Link
                    href="https://docs.unchained.shop/src/docs/admin-ui/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
                    title={formatMessage({
                      id: 'documentation',
                      defaultMessage: 'Documentation',
                    })}
                  >
                    <DocumentTextIcon className="h-6 w-6" />
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={`flex flex-1 flex-col ${narrowNav ? 'md:pl-16' : 'md:pl-64 2xl:pl-96'}`}
      >
        <div className="flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-800 md:hidden border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            ref={ref}
            onClick={() => setHideNav(!hideNav)}
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-slate-800 dark:text-slate-200"
          >
            <span className="sr-only">
              {formatMessage({
                id: 'open_sidebar',
                defaultMessage: ' Open sidebar',
              })}
            </span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>

          <div className="flex-1 flex justify-center">
            <div className="dark:brightness-0 dark:invert">
              <ImageWithFallback
                src={process.env.NEXT_PUBLIC_LOGO}
                width={41}
                height={25}
                alt={formatMessage({
                  id: 'unchained_logo',
                  defaultMessage: 'Unchained Logo',
                })}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 pr-4">
            <LanguageToggle narrowNav={false} />
            <Link
              href="https://docs.unchained.shop/src/docs/admin-ui/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
              title={formatMessage({
                id: 'documentation',
                defaultMessage: 'Documentation',
              })}
            >
              <DocumentTextIcon className="h-5 w-5" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <main className="container mx-auto max-w-7xl flex-1 px-4 py-5 md:pt-10 lg:pt-5 pb-20 sm:px-6 md:px-8">
          <h3 className="ml-8 text-lg font-medium leading-6 text-slate-900">
            {pageHeader}
          </h3>
          {React.cloneElement(children)}
        </main>
      </div>
    </AuthWrapper>
  );
};

export default Layout;
