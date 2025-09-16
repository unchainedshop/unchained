import { useRouter } from 'next/router';
import Loading from '../../common/components/Loading';
import { convertSortFieldsToQueryFormat } from '../../common/utils/utils';
import useOrders from '../hooks/useOrders';
import OrderList from './OrderList';

const LatestOrders = () => {
  const { query } = useRouter();
  const sort = query?.sort;
  const sortKeys = convertSortFieldsToQueryFormat(sort);
  const { orders, loading } = useOrders({
    sort: sortKeys,
  });

  return !orders?.length && loading ? (
    <Loading />
  ) : (
    <OrderList orders={orders} loading={loading} showUser sortable />
  );
};

export default LatestOrders;
