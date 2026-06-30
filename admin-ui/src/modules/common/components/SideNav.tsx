import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';

import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import useAuth from '../../Auth/useAuth';
import Badge from '@/components/ui/Badge';

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
          className={clsx(
            'flex w-full justify-center items-center p-2 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-focus-ring',
            isChildActive
              ? 'text-text-primary bg-surface-raised'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised',
          )}
          title={item.name}
          onClick={() => setIsOpen(!isOpen)}
        >
          {item?.icon && (
            <item.icon
              className={clsx(
                'h-6 w-6',
                isChildActive ? 'text-text-primary' : 'text-text-secondary',
              )}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className="fixed left-16 top-auto w-48 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 z-[100]"
            style={{ top: dropdownRef.current?.getBoundingClientRect().top }}
          >
            <div className="py-1">
              <div className="px-4 py-2 text-sm font-medium text-text-primary border-b border-border-subtle">
                {item.name}
              </div>
              {item.children
                .filter((f) => !f?.requiredRole || hasRole(f.requiredRole))
                .map((subItem) => (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={clsx(
                      'block px-4 py-2 text-sm text-text-secondary hover:bg-surface-raised focus:outline-hidden focus:ring-2 focus:ring-focus-ring',
                      {
                        'bg-surface-raised text-text-primary':
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
          <DisclosureButton
            className={clsx(
              'group flex w-full cursor-pointer hover:bg-surface-raised items-center rounded-md py-2 pl-2 pr-4 text-left text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-focus-ring',
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {item?.icon && (
              <item.icon
                className="mr-3 h-6 w-6 shrink-0 text-text-secondary group-hover:text-text-primary"
                aria-hidden="true"
              />
            )}
            <span className="flex-1 hover:text-text-primary">{item.name}</span>
            <ChevronDownIcon
              className={clsx(
                'h-5 w-5 transition-all duration-200 ease-out',
                isHovered || open
                  ? 'opacity-100 text-text-secondary'
                  : 'opacity-0',
                open ? 'rotate-180' : 'rotate-0',
              )}
            />
          </DisclosureButton>
          <DisclosurePanel className="pl-6 space-y-1" onClick={onSelected}>
            {item.children
              .filter((f) => !f?.requiredRole || hasRole(f.requiredRole))
              .map((subItem) => (
                <Link
                  key={subItem.name}
                  href={subItem.href}
                  className={clsx(
                    'group flex w-full items-center rounded-md py-2 pl-5 pr-2 text-sm font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary focus:outline-hidden focus:ring-2 focus:ring-focus-ring',
                    {
                      'text-text-primary bg-surface-raised':
                        router.pathname === subItem.href,
                    },
                  )}
                >
                  {subItem.name}
                </Link>
              ))}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  ) : null;
};

const SideNav = ({ navigation, onClick = null, narrowView = false }) => {
  const { hasRole } = useAuth();
  const router = useRouter();

  return (
    <div className="mt-8 flex grow flex-col bg-surface-input">
      <nav
        className={`pb-8 flex-1 space-y-1 bg-surface-input ${narrowView ? 'px-2' : 'px-2 lg:px-4 2xl:px-6'}`}
        aria-label="Sidebar"
      >
        {navigation.map((item) =>
          !item.children &&
          (!item.requiredRole || hasRole(item.requiredRole)) ? (
            <div key={item.name} onClick={onClick}>
              <Link
                href={item?.href || '#'}
                className={clsx(
                  'group flex w-full items-center rounded-md py-2 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-focus-ring',
                  router.asPath === item.href || router.pathname === item.href
                    ? 'text-text-primary bg-surface-raised'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised',
                  {
                    'justify-center': narrowView,
                    'pl-2': !narrowView,
                  },
                )}
                title={narrowView ? item.name : undefined}
              >
                <>
                  {item?.icon && (
                    <item.icon
                      className={clsx('h-6 w-6 shrink-0', {
                        'text-text-primary':
                          router.asPath === item.href ||
                          router.pathname === item.href,
                        'text-text-secondary group-hover:text-text-primary':
                          router.asPath !== item.href &&
                          router.pathname !== item.href,
                        'mr-3': !narrowView,
                      })}
                      aria-hidden="true"
                    />
                  )}
                  {!narrowView && <span className="flex-1">{item.name}</span>}
                  {item.count && <Badge text={item.count} dotted />}
                </>
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
