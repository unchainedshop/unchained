import React from 'react';
import { useIntl } from 'react-intl';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
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
        <div className="text-sm text-text-muted">
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
                className="flex items-center gap-4 p-4 bg-surface rounded-lg shadow-sm border border-border-subtle hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-surface-raised">
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
                  <div className="text-sm font-semibold text-text-primary truncate">
                    {customer?.user?.profile?.displayName ||
                      customer?.user?.username ||
                      'Unknown User'}
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatMessage({ id: 'id', defaultMessage: 'ID' })}{' '}
                    {customer.userId}
                  </div>

                  <div className="text-xs text-text-muted mt-1">
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

                  <div className="text-xs text-text-muted mt-0.5">
                    {formatMessage({
                      id: 'last_order_date',
                      defaultMessage: 'Last order',
                    })}
                    : {formatDateTime(customer.lastOrderDate)}
                  </div>
                </div>
                <Link
                  href={`/users?userId=${customer.userId}`}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-surface-raised transition-colors flex-shrink-0"
                >
                  {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-text-muted">
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
