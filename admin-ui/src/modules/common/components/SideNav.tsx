import { Disclosure } from '@headlessui/react';
import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import useAuth from '../../Auth/useAuth';
import ThemeToggle from './ThemeToggle';

const ChildrenNav = ({ item, hasRole, onSelected, narrowView }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);

  // Check if any child is active
  const isChildActive = item.children?.some(
    (child) => router.pathname === child.href,
  );

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (narrowView) {
    // In narrow view, show only icon with dropdown for children nav items
    return item.children?.some(
      (d) => !d?.requiredRole || hasRole(d?.requiredRole),
    ) ? (
      <div key={item.name} className="relative group" ref={dropdownRef}>
        <button
          className={classNames(
            'flex w-full justify-center items-center p-2 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800',
            isChildActive
              ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
          )}
          title={item.name}
          onClick={() => setIsOpen(!isOpen)}
        >
          {item?.icon && (
            <item.icon
              className={classNames(
                'h-6 w-6',
                isChildActive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-800 dark:text-slate-300',
              )}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className="fixed left-16 top-auto w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-[100]"
            style={{ top: dropdownRef.current?.getBoundingClientRect().top }}
          >
            <div className="py-1">
              <div className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                {item.name}
              </div>
              {item.children
                .filter((f) => !f?.requiredRole || hasRole(f.requiredRole))
                .map((subItem) => (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={classNames(
                      'block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-800',
                      {
                        'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100':
                          router.pathname === subItem.href,
                      },
                    )}
                    onClick={() => {
                      setIsOpen(false);
                      onSelected?.();
                    }}
                  >
                    {subItem.name}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    ) : null;
  }

  return item.children?.some(
    (d) => !d?.requiredRole || hasRole(d?.requiredRole),
  ) ? (
    <Disclosure defaultOpen as="div" key={item.name} className="space-y-1">
      {({ open }) => (
        <>
          <Disclosure.Button
            className={classNames(
              'group flex w-full cursor-pointer hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700 dark:text-slate-400 items-center rounded-md py-2 pl-2 pr-4 text-left text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-800',
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {item?.icon && (
              <item.icon
                className="mr-3 h-6 w-6 shrink-0 text-slate-800 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                aria-hidden="true"
              />
            )}
            <span className="flex-1 dark:text-slate-300 dark:hover:text-white">
              {item.name}
            </span>
            <ChevronDownIcon
              className={classNames(
                'h-5 w-5 transition-all duration-200 ease-out',
                isHovered || open
                  ? 'opacity-100 text-slate-600 dark:text-slate-300'
                  : 'opacity-0',
                open ? 'rotate-180' : 'rotate-0',
              )}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="pl-6 space-y-1" onClick={onSelected}>
            {item.children
              .filter((f) => !f?.requiredRole || hasRole(f.requiredRole))
              .map((subItem) => (
                <Link
                  key={subItem.name}
                  href={subItem.href}
                  className={classNames(
                    'group flex w-full items-center rounded-md py-2 pl-5 pr-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-800',
                    {
                      ' dark:bg-slate-800 text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-50 hover:bg-slate-100':
                        router.pathname === subItem.href,
                    },
                  )}
                >
                  {subItem.name}
                </Link>
              ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  ) : null;
};

const SideNav = ({ navigation, onClick = null, narrowView = false }) => {
  const { hasRole } = useAuth();
  const router = useRouter();

  return (
    <div className="mt-8 flex grow flex-col dark:bg-slate-900">
      <nav
        className={`pb-8 flex-1 space-y-1 bg-white dark:bg-slate-900 ${narrowView ? 'px-2' : 'px-2 lg:px-4 2xl:px-6'}`}
        aria-label="Sidebar"
      >
        {navigation.map((item) =>
          !item.children &&
          (!item.requiredRole || hasRole(item.requiredRole)) ? (
            <div key={item.name} onClick={onClick}>
              <Link
                href={item?.href || '#'}
                className={classNames(
                  'group flex w-full items-center rounded-md py-2 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-800',
                  router.asPath === item.href || router.pathname === item.href
                    ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
                  {
                    'justify-center': narrowView,
                    'pl-2': !narrowView,
                  },
                )}
                title={narrowView ? item.name : undefined}
              >
                {item?.icon && (
                  <item.icon
                    className={classNames('h-6 w-6 shrink-0', {
                      'text-slate-900 dark:text-slate-100':
                        router.asPath === item.href ||
                        router.pathname === item.href,
                      'text-slate-800 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100':
                        router.asPath !== item.href &&
                        router.pathname !== item.href,
                      'mr-3': !narrowView,
                    })}
                    aria-hidden="true"
                  />
                )}
                {!narrowView && (
                  <span className="flex-1 dark:text-slate-300">
                    {item.name}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <ChildrenNav
              key={item.name}
              item={item}
              hasRole={hasRole}
              onSelected={onClick}
              narrowView={narrowView}
            />
          ),
        )}
      </nav>
    </div>
  );
};

export default SideNav;
