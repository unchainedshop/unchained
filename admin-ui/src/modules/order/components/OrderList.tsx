import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import OrderListItem from './OrderListItem';
import Loading from '../../common/components/Loading';

const OrderList = ({ orders, showUser, loading, sortable }) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Table className="min-w-full">
        {(orders || [])?.map((order) => (
          <Table.Row key={order._id} header enablesort={sortable}>
            <Table.Cell sortKey="orderNumber">
              {formatMessage({
                id: 'order_number',
                defaultMessage: 'Order #',
              })}
            </Table.Cell>

            <Table.Cell sortKey="ordered" defaultSortDirection="DESC">
              {formatMessage({
                id: 'order_date',
                defaultMessage: 'Order date',
              })}
            </Table.Cell>

            <Table.Cell>
              {formatMessage({
                id: 'total',
                defaultMessage: 'Total',
              })}
            </Table.Cell>

            {showUser && (
              <Table.Cell>
                {formatMessage({
                  id: 'user',
                  defaultMessage: 'User',
                })}
              </Table.Cell>
            )}

            <Table.Cell sortKey="status">
              {formatMessage({
                id: 'status',
                defaultMessage: 'Status',
              })}
            </Table.Cell>
          </Table.Row>
        ))}
        {(orders || [])?.map((order) => (
          <OrderListItem key={`${order?._id}-body`} order={order} showUser />
        ))}
      </Table>
    </>
  );
};

export default OrderList;
