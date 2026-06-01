import { CreditCardIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import Badge from '@/components/ui/Badge';
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
    <div className="relative border rounded-xl p-4 shadow-sm bg-surface-input space-y-4 w-full">
      <Link
        href={getNormalizedDetailPageLink(type, provider) || '/'}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-surface-raised transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>

      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-1 text-slate-500 dark:text-slate-300">
          <CreditCardIcon className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {provider.adapterKey}
            </h3>
          </div>

          <div className="flex items-center flex-wrap gap-3 text-xs text-text-muted">
            <Badge text={provider.type} square dotted />
            <CopyableId
              id={provider._id}
              className="bg-surface-raised px-2 py-1 rounded text-xs text-text-muted"
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
