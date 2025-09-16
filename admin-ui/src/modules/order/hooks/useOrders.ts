import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IOrdersQuery,
  IOrdersQueryVariables,
  ISortDirection,
} from '../../../gql/types';
import { DefaultLimit } from '../../common/data/miscellaneous';
import OrderFragment from '../fragments/OrderFragment';

const OrdersQuery = gql`
  query Orders(
    $limit: Int
    $offset: Int
    $includeCarts: Boolean
    $queryString: String
    $sort: [SortOptionInput!]
    $paymentProviderIds: [String!]
    $deliveryProviderIds: [String!]
    $dateRange: DateFilterInput
    $status: [OrderStatus!]
  ) {
    orders(
      limit: $limit
      offset: $offset
      includeCarts: $includeCarts
      queryString: $queryString
      sort: $sort
      paymentProviderIds: $paymentProviderIds
      deliveryProviderIds: $deliveryProviderIds
      dateRange: $dateRange
      status: $status
    ) {
      ...OrderFragment
    }
    ordersCount(
      includeCarts: $includeCarts
      queryString: $queryString
      paymentProviderIds: $paymentProviderIds
      deliveryProviderIds: $deliveryProviderIds
      dateRange: $dateRange
      status: $status
    )
  }
  ${OrderFragment}
`;

const useOrders = ({
  limit = DefaultLimit,
  offset = 0,
  includeCarts = false,
  queryString = '',
  sort: sortOptions = [],
  dateRange,
  status,
  deliveryProviderIds,
  paymentProviderIds,
}: IOrdersQueryVariables = {}) => {
  const { data, loading, error, fetchMore } = useQuery<
    IOrdersQuery,
    IOrdersQueryVariables
  >(OrdersQuery, {
    variables: {
      limit,
      deliveryProviderIds: deliveryProviderIds?.length
        ? deliveryProviderIds
        : null,
      paymentProviderIds: paymentProviderIds?.length
        ? paymentProviderIds
        : null,
      offset,
      includeCarts,
      queryString,
      dateRange,
      status,
      sort: sortOptions.length
        ? [...sortOptions, { key: 'created', value: ISortDirection.Desc }]
        : [
            { key: 'ordered', value: ISortDirection.Desc },
            { key: 'created', value: ISortDirection.Desc },
          ],
    },
  });
  const orders = data?.orders || [];
  const ordersCount = data?.ordersCount;
  const hasMore = orders?.length < ordersCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: orders?.length },
    });
  };

  return {
    orders,
    ordersCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useOrders;
