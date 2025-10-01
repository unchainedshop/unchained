import { CreditCardIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import Badge from '../../common/components/Badge';
import { useIntl } from 'react-intl';
import CopyableId from './shared/CopyableId';
import ConfigurationDisplay from './shared/ConfigurationDisplay';

const getNormalizedDetailPageLink = (type, provider) => {
  if (type === 'PAYMENT')
    return `/payment-provider?paymentProviderId=${provider._id}`;
  if (type === 'DELIVERY')
    return `/delivery-provider?deliveryProviderId=${provider._id}`;
  if (type === 'WAREHOUSING')
    return `/warehousing-provider?warehousingProviderId=${provider._id}`;
};
export const CopilotProviderListItem = ({ provider, type }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4 w-full">
      <Link
        href={getNormalizedDetailPageLink(type, provider) || '/'}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>

      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-1 text-slate-500 dark:text-slate-300">
          <CreditCardIcon className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {provider.adapterKey}
            </h3>
          </div>

          <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <Badge text={provider.type} square dotted />
            <CopyableId
              id={provider._id}
              className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-slate-500 dark:text-slate-400"
            />
            <span>
              {formatMessage({ id: 'created', defaultMessage: 'Created' })}:{' '}
              {new Date(provider.created).toLocaleDateString()}
            </span>
            <span>
              {formatMessage({
                id: 'provider_configuration_items',
                defaultMessage: 'Config items',
              })}
              : {provider.configuration?.length ?? 0}
            </span>
          </div>
        </div>
      </div>
      <ConfigurationDisplay configuration={provider.configuration} />
    </div>
  );
};

const CopilotProviderList = ({ providers, type }) => {
  if (!providers?.length) return null;
  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <CopilotProviderListItem
          type={type}
          key={provider._id}
          provider={provider}
        />
      ))}
    </div>
  );
};

export default CopilotProviderList;
