import React from 'react';
import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
import { ORDER_STATUSES } from '../../common/data/miscellaneous';

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'OPEN'
  | 'FULLFILLED'
  | 'REJECTED'
  | string;

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  OPEN: 'bg-gray-100 text-gray-800',
  FULLFILLED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};
export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const { formatMessage } = useIntl();

  const statusMessages: Record<string, string> = {
    PENDING: formatMessage({ id: 'pending', defaultMessage: 'PENDING' }),
    CONFIRMED: formatMessage({ id: 'confirmed', defaultMessage: 'CONFIRMED' }),
    OPEN: formatMessage({ id: 'open', defaultMessage: 'OPEN' }),
    FULLFILLED: formatMessage({ id: 'fulfilled', defaultMessage: 'FULFILLED' }),
    REJECTED: formatMessage({ id: 'rejected', defaultMessage: 'REJECTED' }),
  };

  const message =
    statusMessages?.[status] ??
    formatMessage({
      id: 'cart',
      defaultMessage: 'Cart',
    });
  const color = statusColors?.[status] ?? 'bg-gray-200 text-gray-800';

  return (
    <Badge
      text={message}
      color={ORDER_STATUSES[status]}
      square
      className={`uppercase ${className}`}
    />
  );
};
