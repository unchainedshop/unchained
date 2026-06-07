import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import {
  MagnifyingGlassIcon,
  CubeIcon,
  UserIcon,
  InboxStackIcon,
  RectangleStackIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  DocumentTextIcon,
  BoltIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import useGlobalSearch from '../hooks/useGlobalSearch';
import { useSearch } from '../SearchContext';
import deBounce from '../../common/utils/deBounce';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import generateUniqueId from '../../common/utils/getUniqueId';
import type { IGlobalSearchQuery, ISearchableEntity } from '../../../gql/types';

type SearchResult = IGlobalSearchQuery['globalSearch']['results'][number];

const typeIcons: Record<string, React.ElementType> = {
  SimpleProduct: CubeIcon,
  ConfigurableProduct: CubeIcon,
  BundleProduct: CubeIcon,
  PlanProduct: CubeIcon,
  TokenizedProduct: CubeIcon,
  User: UserIcon,
  Order: InboxStackIcon,
  Assortment: RectangleStackIcon,
  Filter: AdjustmentsHorizontalIcon,
  Enrollment: CalendarIcon,
  Quotation: DocumentTextIcon,
  Work: BoltIcon,
};

const typeLabels: Record<string, string> = {
  SimpleProduct: 'Product',
  ConfigurableProduct: 'Product',
  BundleProduct: 'Product',
  PlanProduct: 'Product',
  TokenizedProduct: 'Product',
  User: 'User',
  Order: 'Order',
  Assortment: 'Assortment',
  Filter: 'Filter',
  Enrollment: 'Enrollment',
  Quotation: 'Quotation',
  Work: 'Work',
};

const typeViewAllPaths: Record<string, string> = {
  PRODUCT: '/products',
  USER: '/users',
  ORDER: '/orders',
  ASSORTMENT: '/assortments',
  FILTER: '/filters',
  ENROLLMENT: '/enrollments',
  QUOTATION: '/quotations',
  WORK: '/works',
};

function getResultTitle(result: SearchResult): string {
  switch (result.__typename) {
    case 'SimpleProduct':
    case 'ConfigurableProduct':
    case 'BundleProduct':
    case 'PlanProduct':
    case 'TokenizedProduct':
    case 'Assortment':
      return result.texts?.title || result._id;
    case 'User':
      return (
        result.name ||
        result.username ||
        result.emails?.[0]?.address ||
        result._id
      );
    case 'Order':
      return result.orderNumber || result._id;
    case 'Filter':
      return result.key || result._id;
    case 'Enrollment':
    case 'Quotation':
      return result._id;
    case 'Work':
      return `${result.type} - ${result._id.slice(0, 8)}`;
  }
}

function getResultImageUrl(result: SearchResult): string | null {
  switch (result.__typename) {
    case 'SimpleProduct':
    case 'ConfigurableProduct':
    case 'BundleProduct':
    case 'PlanProduct':
    case 'TokenizedProduct':
    case 'Assortment':
      return result.media?.[0]?.file?.url || null;
    case 'User':
      return result.avatar?.url || null;
    default:
      return null;
  }
}

function getResultHref(result: SearchResult): string {
  switch (result.__typename) {
    case 'SimpleProduct':
    case 'ConfigurableProduct':
    case 'BundleProduct':
    case 'PlanProduct':
    case 'TokenizedProduct':
      return `/products?slug=${generateUniqueId(result)}`;
    case 'User':
      return `/users?userId=${result._id}`;
    case 'Order':
      return `/orders?orderId=${result._id}`;
    case 'Assortment':
      return `/assortments?assortmentSlug=${generateUniqueId(result)}`;
    case 'Filter':
      return `/filters?filterId=${result._id}`;
    case 'Enrollment':
      return `/enrollments?enrollmentId=${result._id}`;
    case 'Quotation':
      return `/quotations?quotationId=${result._id}`;
    case 'Work':
      return `/works?workerId=${result._id}`;
  }
}

const LoadingSkeleton = () => (
  <div className="py-2 px-4 space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 animate-pulse">
        <div className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-5 w-14 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    ))}
  </div>
);

const CommandPalette = () => {
  const { isOpen, close, toggle } = useSearch();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const { search, clear, results, counts, loading, error } = useGlobalSearch();
  const router = useRouter();
  const { formatMessage } = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const quickNavItems = useMemo(
    () => [
      {
        label: formatMessage({ id: 'products', defaultMessage: 'Products' }),
        href: '/products',
        icon: CubeIcon,
      },
      {
        label: formatMessage({ id: 'orders', defaultMessage: 'Orders' }),
        href: '/orders',
        icon: InboxStackIcon,
      },
      {
        label: formatMessage({ id: 'users', defaultMessage: 'Users' }),
        href: '/users',
        icon: UserIcon,
      },
      {
        label: formatMessage({
          id: 'assortments',
          defaultMessage: 'Assortments',
        }),
        href: '/assortments',
        icon: RectangleStackIcon,
      },
    ],
    [formatMessage],
  );

  const debouncedSearch = useMemo(
    () =>
      deBounce(300)((value: string) => {
        if (value.trim().length >= 2) {
          search(value);
        } else {
          clear();
        }
      }),
    [search, clear],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, toggle]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveIndex(0);
      clear();
    }
  }, [isOpen, clear]);

  useEffect(() => {
    const handleRouteChange = () => close();
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router, close]);

  useEffect(() => {
    if (!keyboardNav) return;
    const activeItem = listRef.current?.children[activeIndex] as HTMLElement;
    activeItem?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, keyboardNav]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(0);
    debouncedSearch(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setKeyboardNav(true);
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setKeyboardNav(true);
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      router.push(getResultHref(results[activeIndex]));
      close();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(getResultHref(result));
    close();
  };

  const handleMouseEnter = (index: number) => {
    setKeyboardNav(false);
    setActiveIndex(index);
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length >= 2;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={formatMessage({
        id: 'global_search_placeholder',
        defaultMessage: 'Search',
      })}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />
      <div className="fixed inset-0 flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-700">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-4 bg-transparent border-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-sm"
              placeholder={formatMessage({
                id: 'global_search_placeholder',
                defaultMessage: 'Search products, orders, users...',
              })}
              aria-label={formatMessage({
                id: 'global_search_placeholder',
                defaultMessage: 'Search products, orders, users...',
              })}
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="px-4 py-6 text-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  {formatMessage({
                    id: 'global_search_error',
                    defaultMessage: 'Search failed. Please try again.',
                  })}
                </p>
              </div>
            )}

            {!error && loading && hasQuery && results.length === 0 && (
              <LoadingSkeleton />
            )}

            {!error && !loading && hasQuery && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                {formatMessage({
                  id: 'no_results_found',
                  defaultMessage: 'No results found',
                })}
              </div>
            )}

            {!error && results.length > 0 && (
              <>
                <ul ref={listRef} className="py-2" role="listbox">
                  {results.map((result: SearchResult, index: number) => {
                    const Icon = typeIcons[result.__typename] || CubeIcon;
                    const label = typeLabels[result.__typename] || 'Unknown';
                    const isActive = index === activeIndex;
                    const imageUrl = getResultImageUrl(result);

                    return (
                      <li
                        key={`${result.__typename}-${result._id}`}
                        onClick={() => handleResultClick(result)}
                        onMouseEnter={() => handleMouseEnter(index)}
                        role="option"
                        aria-selected={isActive}
                        className={`flex items-center px-4 py-2.5 cursor-pointer ${
                          isActive
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {imageUrl ? (
                          <div className="h-8 w-8 mr-3 shrink-0 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <ImageWithFallback
                              src={imageUrl}
                              alt={getResultTitle(result)}
                              width={32}
                              height={32}
                              className="h-8 w-8 object-cover"
                            />
                          </div>
                        ) : (
                          <Icon className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-slate-900 dark:text-slate-100 truncate block">
                            {getResultTitle(result)}
                          </span>
                        </div>
                        <span className="ml-3 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {loading && (
                  <div className="px-4 py-1.5 border-t border-slate-200 dark:border-slate-700">
                    <div className="h-1 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </div>
                )}
              </>
            )}

            {!error && counts.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex flex-wrap gap-2">
                {counts
                  .filter((c) => c.totalCount > 0)
                  .map((c) => {
                    const path = typeViewAllPaths[c.type];
                    return (
                      <button
                        key={c.type}
                        onClick={() => {
                          router.push(
                            `${path}?queryString=${encodeURIComponent(query)}`,
                          );
                          close();
                        }}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
                      >
                        {formatMessage({
                          id: c.type.toLowerCase(),
                          defaultMessage: c.type,
                        })}
                        : {c.totalCount}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {!hasQuery && !error && (
            <div className="px-4 py-4">
              <p className="text-xs text-slate-400 mb-3">
                {formatMessage({
                  id: 'global_search_hint',
                  defaultMessage: 'Type at least 2 characters to search',
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickNavItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      close();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
