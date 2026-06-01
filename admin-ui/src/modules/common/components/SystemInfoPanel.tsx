import React from 'react';
import { useIntl } from 'react-intl';
import useShopInfo from '../hooks/useShopInfo';

const SystemInfoPanel = () => {
  const { formatMessage } = useIntl();
  const { shopInfo } = useShopInfo();

  return (
    <div className="bg-surface rounded-lg border border-border-subtle p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {formatMessage({
          id: 'system_information',
          defaultMessage: 'System Information',
        })}
      </h3>
      <div className="space-y-3">
        <InfoRow
          label={formatMessage({
            id: 'engine_version',
            defaultMessage: 'Engine version',
          })}
          value={shopInfo?.version || 'n/a'}
        />
        <InfoRow
          label={formatMessage({
            id: 'resolved_language',
            defaultMessage: 'Resolved language',
          })}
          value={`${shopInfo?.language?.name || 'n/a'} (${shopInfo?.language?.isoCode || 'n/a'})`}
        />
        <InfoRow
          label={formatMessage({
            id: 'resolved_country',
            defaultMessage: 'Resolved country',
          })}
          value={
            <span className="flex items-center gap-2">
              <span className="text-base">
                {shopInfo?.country?.flagEmoji || 'n/a'}
              </span>
              {shopInfo?.country?.name || 'n/a'} (
              {shopInfo?.country?.isoCode || 'n/a'})
            </span>
          }
        />
        <InfoRow
          label={formatMessage({
            id: 'default_currency',
            defaultMessage: 'Default currency',
          })}
          value={shopInfo?.country?.defaultCurrency?.isoCode || 'n/a'}
        />
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-text-secondary">{label}</span>
    <span className="text-sm text-text-primary">{value}</span>
  </div>
);

export default SystemInfoPanel;
