import React from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import {
  normalizeCountryISOCode,
  normalizeCurrencyISOCode,
} from '../../common/utils/utils';
import getFlagEmoji from '../../common/utils/getFlagEmoji';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import Link from 'next/link';
import CopyableId from './shared/CopyableId';

export const CountryItemCompact = ({ country }) => {
  const { formatMessage, locale } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const flag = getFlagEmoji(country.isoCode);

  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-surface-input space-y-4">
      <Link
        href={`/country?countryId=${country._id}`}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-surface-raised transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 flex-shrink-0 bg-surface-raised rounded-md flex items-center justify-center text-xl">
          {flag || <GlobeAltIcon className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {normalizeCountryISOCode(locale, country.isoCode)}
          </h3>
          <CopyableId id={country._id} />
          <div className="text-xs text-text-secondary mt-1">
            {formatMessage({
              id: 'default_currency',
              defaultMessage: 'Default currency',
            })}
            : {normalizeCurrencyISOCode(locale, country.defaultCurrencyCode)}
          </div>
        </div>

        <div className="flex flex-col items-end text-xs text-text-muted whitespace-nowrap mt-8 gap-1">
          <span
            className={`text-xs font-medium rounded px-2 py-0.5 ${
              country.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
            }`}
          >
            {country.isActive
              ? formatMessage({ id: 'active', defaultMessage: 'Active' })
              : formatMessage({
                  id: 'inactive',
                  defaultMessage: 'In-Active',
                })}
          </span>
          <span>
            {formatMessage({ id: 'created', defaultMessage: 'Created' })}:{' '}
            {formatDateTime(country.created)}
          </span>
          {country.updated && (
            <span>
              {formatMessage({ id: 'updated', defaultMessage: 'Updated' })}:{' '}
              {formatDateTime(country.updated)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const CopilotCountryList = ({ countries, toolCallId }) => {
  if (!countries?.length) return null;
  return (
    <div className="space-y-3">
      {countries.map((country) => (
        <CountryItemCompact
          country={country}
          key={`${toolCallId}-${country?._id}`}
        />
      ))}
    </div>
  );
};

export default CopilotCountryList;
