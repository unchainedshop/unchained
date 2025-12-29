import { useIntl } from 'react-intl';
import useFormatDateTime from '../../../common/utils/useFormatDateTime';
import { useFormatPrice } from '../../../common/utils/utils';
import { OrderStatusBadge } from '../../../order/components/OrderStatusBadge';
import Link from 'next/link';
import Badge from '../../../common/components/Badge';
import {
  DELIVERY_STATUSES,
  PAYMENT_STATUSES,
} from '../../../common/data/miscellaneous';

const CopilotOrderItemWrapper = ({ order, children = null }) => {
  const { formatPrice } = useFormatPrice();
  const { formatDateTime } = useFormatDateTime();
  const { formatMessage } = useIntl();

  if (!order) return children;
  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4">
      <Link
        href={`/orders?orderId=${order?._id}`}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {formatMessage({ id: 'view', defaultMessage: 'View' })}
      </Link>

      <div className="absolute top-10 right-2 flex gap-2 items-end">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
          {formatPrice(order?.total)}
        </div>
      </div>

      <div className="absolute top-16 right-2 flex gap-2 items-end">
        <OrderStatusBadge status={order?.status} />

        {order?.delivery?.status && (
          <Badge
            text={order.delivery.status}
            color={DELIVERY_STATUSES[order.delivery.status]}
            square
            className="uppercase"
          />
        )}

        {order?.payment?.status && (
          <Badge
            text={order.payment.status}
            color={PAYMENT_STATUSES[order.payment.status]}
            square
            className="uppercase"
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {formatMessage({ id: 'order_number', defaultMessage: 'Order #' })}{' '}
            {order?.orderNumber || order?._id}
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {order?.billingAddress?.firstName} {order?.billingAddress?.lastName}
            {order?.billingAddress?.company &&
              ` — ${order.billingAddress.company}`}
          </div>

          <div className="text-xs text-slate-400 truncate">
            {order?.billingAddress?.city}, {order?.billingAddress?.countryCode}
          </div>

          <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {formatMessage({ id: 'ordered', defaultMessage: 'Ordered' })}:{' '}
              <strong>{formatDateTime(order?.ordered)}</strong>
            </span>
            <span>
              {formatMessage({ id: 'confirmed', defaultMessage: 'Confirmed' })}:{' '}
              <strong>{formatDateTime(order?.confirmed)}</strong>
            </span>
            {order?.fulfilled && (
              <span>
                {formatMessage({
                  id: 'fulfilled',
                  defaultMessage: 'Fulfilled',
                })}
                : <strong>{formatDateTime(order?.fulfilled)}</strong>
              </span>
            )}
            {order?.delivery?.delivered && (
              <span>
                {formatMessage({
                  id: 'delivered',
                  defaultMessage: 'Delivered',
                })}
                : <strong>{formatDateTime(order?.delivery?.delivered)}</strong>
              </span>
            )}
            {order?.payment?.paid && (
              <span>
                {formatMessage({ id: 'paid', defaultMessage: 'Paid' })}:{' '}
                <strong>{formatDateTime(order?.payment?.paid)}</strong>
              </span>
            )}
          </div>
        </div>
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

export default CopilotOrderItemWrapper;
