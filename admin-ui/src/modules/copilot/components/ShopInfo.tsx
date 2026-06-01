import { InformationCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { useIntl } from 'react-intl';
import {
  normalizeCountryISOCode,
  normalizeCurrencyISOCode,
  normalizeLanguageISOCode,
} from '../../common/utils/utils';

type ShopInfo = {
  version: string;
  defaultLanguageIsoCode: string;
  country: {
    isoCode: string;
    defaultCurrencyCode: string;
  };
  language: {
    isoCode: string;
  };
};

const ShopInfoCard = (shopInfo: ShopInfo) => {
  const { formatMessage, locale } = useIntl();
  const items = [
    {
      label: formatMessage({
        id: 'default_system_locale',
        defaultMessage: 'Default Locale',
      }),
      value: normalizeLanguageISOCode(locale, shopInfo?.defaultLanguageIsoCode),
    },
    {
      label: formatMessage({ id: 'language', defaultMessage: 'Language' }),
      value: normalizeLanguageISOCode(locale, shopInfo?.language?.isoCode),
    },
    {
      label: formatMessage({ id: 'country', defaultMessage: 'Country' }),
      value: normalizeCountryISOCode(locale, shopInfo?.country?.isoCode),
    },
    {
      label: formatMessage({ id: 'currency', defaultMessage: 'Currency' }),
      value: normalizeCurrencyISOCode(
        locale,
        shopInfo?.country?.defaultCurrencyCode,
      ),
    },
    {
      label: formatMessage({ id: 'version', defaultMessage: 'Version' }),
      value: shopInfo?.version,
    },
  ];

  return (
    <div className="mt-5 flex gap-4 p-4 bg-surface border border-border-subtle rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="w-12 h-12 flex-shrink-0 bg-surface-raised rounded-md flex items-center justify-center text-blue-500">
        <InformationCircleIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-text-primary mb-1">
          {formatMessage({ id: 'shop_info', defaultMessage: 'Shop Info' })}
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-text-secondary">
          {items.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-text-muted">{label}</dt>
              <dd className="font-medium truncate">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default ShopInfoCard;
