import React from 'react';
import { useIntl } from 'react-intl';

type CopilotCountProps = {
  count: number;
};

const copilotCount = (
  type:
    | 'EVENT'
    | 'WORKER'
    | 'PRODUCT'
    | 'ASSORTMENT'
    | 'COUNTRY'
    | 'CURRENCY'
    | 'LANGUAGE'
    | 'USER'
    | 'ORDER'
    | 'FILTER'
    | 'QUOTATION',
) => {
  const Component = ({ count }: CopilotCountProps) => {
    const { formatMessage } = useIntl();

    const COUNT_TYPES: Record<string, string> = {
      EVENT: formatMessage({ id: 'events', defaultMessage: 'Events' }),
      WORKER: formatMessage({ id: 'workers', defaultMessage: 'Workers' }),
      PRODUCT: formatMessage({ id: 'products', defaultMessage: 'Products' }),
      ASSORTMENT: formatMessage({
        id: 'assortments',
        defaultMessage: 'Assortments',
      }),
      LANGUAGE: formatMessage({
        id: 'languages',
        defaultMessage: 'Languages',
      }),
      COUNTRY: formatMessage({
        id: 'countries',
        defaultMessage: 'Countries',
      }),
      CURRENCY: formatMessage({
        id: 'currencies',
        defaultMessage: 'Currencies',
      }),
      USER: formatMessage({
        id: 'users',
        defaultMessage: 'Users',
      }),
      ORDER: formatMessage({
        id: 'orders',
        defaultMessage: 'Orders',
      }),
      FILTER: formatMessage({
        id: 'filters',
        defaultMessage: 'Filters',
      }),
    };

    const text =
      COUNT_TYPES[type] ||
      formatMessage({ id: 'items', defaultMessage: 'Items' });

    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center">
        <dl>
          <dt className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            {text}
          </dt>
          <dd className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {count.toLocaleString()}
          </dd>
        </dl>
      </div>
    );
  };

  Component.displayName = `CopilotCount(${type})`;
  return Component;
};

export default copilotCount;
