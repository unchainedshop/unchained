import classNames from 'classnames';
import { useRouter } from 'next/router';
import React from 'react';

import { useIntl } from 'react-intl';

interface TabItem {
  id: string;
  title?: string;
  Icon?: React.ReactNode;
  length?: number;
}

interface TabProps {
  children: React.ReactElement<{ selectedView?: string }>;
  tabItems: TabItem[];
  defaultTab?: string;
  updateRoute?: boolean;
}

const Tab = ({
  children,
  tabItems,
  defaultTab,
  updateRoute = true,
}: TabProps) => {
  const router = useRouter();

  const { tab = defaultTab } = router?.query || {};
  const currentTab = Array.isArray(tab) ? tab[0] : tab;
  const { formatMessage } = useIntl();
  const onTabSelected = (selectedTab: string) => {
    if (updateRoute) {
      const { sort, ...queryWithoutSort } = router?.query || {};
      router.push(
        {
          query: { ...queryWithoutSort, tab: selectedTab },
        },
        undefined,
        {
          shallow: true,
        },
      );
    }
  };

  return (
    <div className="mt-10">
      <div className="lg:hidden">
        <label htmlFor="selected-tab" className="sr-only">
          {formatMessage({
            id: 'select_tab',
            defaultMessage: 'Select a tab',
          })}
        </label>

        <select
          onChange={(e) => onTabSelected(e.target.value)}
          id="selected-tab"
          name="selected-tab"
          className="mt-1 block dark:bg-slate-800 dark:text-white w-full rounded-md border-slate-300 dark:border-slate-600 py-2 pl-3 pr-10 text-base capitalize focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:border-slate-800 dark:focus:border-slate-400 sm:text-sm"
          value={currentTab}
        >
          {tabItems.filter(Boolean).map((value) => (
            <option key={value.id} value={value.id} className="dark:text-white">
              {value?.title || value?.id}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-5 hidden lg:block">
        <div className="">
          <nav className="flex flex-wrap gap-3">
            {tabItems.filter(Boolean).map((option) => (
              <a
                id={option.id}
                key={option.id}
                tabIndex={0}
                onClick={() => onTabSelected(option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTabSelected(option.id);
                  }
                }}
                className={classNames(
                  {
                    'cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:text-slate-100 dark:bg-slate-900 shadow-sm dark:hover:border-slate-500 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900':
                      currentTab === option.id,
                  },
                  'cursor-pointer relative whitespace-nowrap border border-slate-200 dark:border-slate-800 py-2 px-1 pr-3 pl-2 text-sm dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                )}
              >
                <div className="flex items-center space-x-1">
                  <div>{option.Icon}</div>
                  <div className="capitalize">
                    {option?.title || option?.id}
                  </div>
                  {option?.length ? (
                    <span className="absolute top-0 right-0 inline-flex translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-slate-400 px-1 py-0.5 text-sm leading-none text-slate-900">
                      {option?.length}
                    </span>
                  ) : null}
                </div>
              </a>
            ))}
          </nav>
        </div>
      </div>
      <div className="mt-5">
        {React.cloneElement(children, { selectedView: currentTab })}
      </div>
    </div>
  );
};

export default Tab;
