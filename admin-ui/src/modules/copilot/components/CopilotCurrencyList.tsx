import React from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import { normalizeCurrencyISOCode } from '../../common/utils/utils';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import CopyableId from './shared/CopyableId';

export const CurrencyItemCompact = ({ currency }) => {
  const { locale, formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  const decimals = currency.decimals ?? 2;

  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4">
      <Link
        href={`/currency?currencyId=${currency._id}`}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-emerald-500">
          <BanknotesIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {normalizeCurrencyISOCode(locale, currency.isoCode)}
          </h3>
          <CopyableId id={currency._id} />

          <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
            {formatMessage({ id: 'decimals', defaultMessage: 'Decimals' })}:{' '}
            {decimals}
          </div>

          {currency.contractAddress && (
            <div className="text-xs text-slate-700 dark:text-slate-300 truncate mt-1">
              {formatMessage({
                id: 'contract_address',
                defaultMessage: 'Contract Address',
              })}
              : <span className="font-mono">{currency.contractAddress}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mt-8 gap-1">
          <span
            className={`text-xs font-medium rounded px-2 py-0.5 ${
              currency.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
            }`}
          >
            {currency.isActive
              ? formatMessage({ id: 'active', defaultMessage: 'Active' })
              : formatMessage({ id: 'inactive', defaultMessage: 'In-Active' })}
          </span>
          <span>
            {formatMessage({ id: 'created', defaultMessage: 'Created' })}:{' '}
            {formatDateTime(currency.created)}
          </span>
          {currency.updated && (
            <span>
              {formatMessage({ id: 'updated', defaultMessage: 'Updated' })}:{' '}
              {formatDateTime(currency.updated)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const CopilotCurrencyList = ({
  currencies,
  toolCallId,
}: {
  currencies: any[];
  toolCallId: string;
}) => {
  if (!currencies?.length) return null;
  return (
    <div className="space-y-2">
      {currencies.map((currency) => (
        <CurrencyItemCompact
          currency={currency}
          key={`${toolCallId}-${currency._id}`}
        />
      ))}
    </div>
  );
};

export default CopilotCurrencyList;
