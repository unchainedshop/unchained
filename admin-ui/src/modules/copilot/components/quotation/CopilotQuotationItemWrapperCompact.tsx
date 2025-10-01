import React from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import { formatDistance } from 'date-fns';
import CopyableId from '../shared/CopyableId';
import Badge from '../../../common/components/Badge';
import { QUOTATION_STATUS } from '../../../common/data/miscellaneous';
import ConfigurationDisplay from '../shared/ConfigurationDisplay';

const CopilotQuotationItemWrapperCompact = ({ quotation, children }) => {
  const { formatMessage } = useIntl();

  if (!quotation) return children;

  const {
    _id,
    quotationNumber,
    status,
    created,
    expires,
    user,
    country,
    currency,
    configuration,
  } = quotation;

  const userName =
    user?.username ||
    user?.profile?.displayName ||
    user?.name ||
    user?.emails?.[0]?.address;
  const userId = user?._id;
  const createdAgo = created
    ? formatDistance(new Date(created), new Date(), { addSuffix: true })
    : '';
  const expiresIn = expires
    ? formatDistance(new Date(expires), new Date(), { addSuffix: true })
    : null;

  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4">
      <div className="absolute top-2 right-2 text-xs font-medium">
        <Badge text={status} color={QUOTATION_STATUS[status]} square />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {quotationNumber && (
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
              #{quotationNumber}
            </span>
          )}

          <CopyableId id={_id} />
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {formatMessage({
              id: 'requested_by',
              defaultMessage: 'Requested by',
            })}
            :{' '}
            {userId ? (
              <Link
                href={`/users/edit?userId=${userId}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {userName}
              </Link>
            ) : (
              <strong>{userName}</strong>
            )}
          </div>

          <div>
            {formatMessage({ id: 'created', defaultMessage: 'Created' })}:{' '}
            <strong>{createdAgo}</strong>
          </div>

          {expiresIn && (
            <div>
              {formatMessage({ id: 'expires', defaultMessage: 'Expires' })}:{' '}
              <strong>{expiresIn}</strong>
            </div>
          )}

          {country && (
            <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
              {country.isoCode}
            </div>
          )}

          {currency && (
            <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
              {currency.isoCode}
            </div>
          )}
        </div>

        <ConfigurationDisplay configuration={configuration} />
      </div>

      {children && (
        <div className="pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-inner border border-slate-200 dark:border-slate-700">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotQuotationItemWrapperCompact;
