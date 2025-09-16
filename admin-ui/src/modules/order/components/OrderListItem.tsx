import Link from 'next/link';
import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import formatUsername from '../../common/utils/formatUsername';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import { useFormatPrice } from '../../common/utils/utils';
import { OrderStatusBadge } from './OrderStatusBadge';

const OrderListItem = ({ order, showUser }) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();
  const { formatDateTime } = useFormatDateTime();
  return (
    <Table.Row className="group">
      <Table.Cell>
        <Link
          href={`/orders?orderId=${order._id}`}
          className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-200"
        >
          {order?.orderNumber || (
            <>
              {order._id}{' '}
              <Badge
                color="yellow"
                text={formatMessage({ id: 'cart', defaultMessage: 'Cart' })}
              />
            </>
          )}
        </Link>
      </Table.Cell>
      <Table.Cell>
        <Link
          href={`/orders?orderId=${order._id}`}
          className="flex items-center text-sm dark:text-slate-300"
        >
          {formatDateTime(order.ordered, {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </Link>
      </Table.Cell>
      <Table.Cell>
        <Link
          href={`/orders?orderId=${order._id}`}
          className="flex items-center text-sm dark:text-slate-300"
        >
          {formatPrice(order.total)}
        </Link>
      </Table.Cell>
      {showUser && order.user && (
        <Table.Cell>
          <Link
            href={`/users?userId=${order.user._id}`}
            className="flex items-center text-sm text-slate-800 dark:text-slate-300 hover:text-decoration"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-medium">{formatUsername(order.user)}</span>
          </Link>
        </Table.Cell>
      )}
      <Table.Cell>
        <Link href={`/orders?orderId=${order._id}`} className="block">
          <OrderStatusBadge status={order.status} />
        </Link>
      </Table.Cell>
    </Table.Row>
  );
};

export default OrderListItem;
