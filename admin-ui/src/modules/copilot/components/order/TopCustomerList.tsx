import React from 'react';
import { useIntl } from 'react-intl';
import ImageWithFallback from '../../../common/components/ImageWithFallback';
import { useFormatPrice } from '../../../common/utils/utils';
import useFormatDateTime from '../../../common/utils/useFormatDateTime';
import Link from 'next/link';

const TopCustomerList = ({ customers, dateRange }) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();
  const { formatDateTime } = useFormatDateTime();
  return (
    <div className="space-y-4">
      {(dateRange?.start || dateRange?.end) && (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {formatMessage({
            id: 'date_range_prefix',
            defaultMessage: 'Showing data from',
          })}{' '}
          <strong>{formatDateTime(dateRange?.start) || '—'}</strong>{' '}
          {formatMessage({ id: 'date_range_to', defaultMessage: 'to' })}{' '}
          <strong>{formatDateTime(dateRange?.end) || '—'}</strong>
        </div>
      )}

      {customers?.length ? (
        <div className="space-y-3">
          {customers.map((customer) => {
            const avatar = customer.user?.avatar?.url;

            return (
              <div
                key={customer.userId}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                  {avatar ? (
                    <ImageWithFallback
                      src={avatar}
                      alt="Customer avatar"
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {customer?.user?.profile?.displayName ||
                      customer?.user?.username ||
                      'Unknown User'}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {formatMessage({ id: 'id', defaultMessage: 'ID' })}{' '}
                    {customer.userId}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatMessage({ id: 'orders', defaultMessage: 'Orders' })}:{' '}
                    <strong>{customer.orderCount}</strong> •{' '}
                    {formatMessage({
                      id: 'average_order_value',
                      defaultMessage: 'Average order value',
                    })}
                    :{' '}
                    <strong>
                      {formatPrice({
                        amount: customer.averageOrderValue,
                        currencyCode: customer?.currencyCode,
                      })}
                    </strong>{' '}
                    •{' '}
                    {formatMessage({
                      id: 'total_spent',
                      defaultMessage: 'Spent',
                    })}
                    :{' '}
                    <strong>
                      {formatPrice({
                        amount: customer.totalSpent,
                        currencyCode: customer?.currencyCode || 'CHF',
                      })}
                    </strong>
                  </div>

                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {formatMessage({
                      id: 'last_order_date',
                      defaultMessage: 'Last order',
                    })}
                    : {formatDateTime(customer.lastOrderDate)}
                  </div>
                </div>
                <Link
                  href={`/users?userId=${customer.userId}`}
                  className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                >
                  {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {formatMessage({
            id: 'no_customers',
            defaultMessage: 'No top customers found.',
          })}
        </div>
      )}
    </div>
  );
};

export default TopCustomerList;
