import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ISortDirection,
  IUserOrderQuery,
  IUserOrderQueryVariables,
} from '../../../gql/types';
import OrderFragment from '../fragments/OrderFragment';

const UserOrdersQuery = gql`
  query UserOrder(
    $userId: ID
    $queryString: String
    $sort: [SortOptionInput!]
    $includeCarts: Boolean
  ) {
    user(userId: $userId) {
      orders(
        queryString: $queryString
        sort: $sort
        includeCarts: $includeCarts
      ) {
        ...OrderFragment
      }
    }
  }
  ${OrderFragment}
`;

const useUserOrders = ({
  userId = null,
  queryString = '',
  sort: sortOptions = [],
  includeCarts = false,
}: IUserOrderQueryVariables = {}) => {
  const { data, loading, error } = useQuery<
    IUserOrderQuery,
    IUserOrderQueryVariables
  >(UserOrdersQuery, {
    skip: !userId,
    variables: {
      userId,
      queryString,
      includeCarts,
      sort: sortOptions.length
        ? sortOptions
        : [{ key: 'ordered', value: ISortDirection.Desc }],
    },
  });

  const orders = data?.user?.orders;

  return {
    orders,
    loading,
    error,
  };
};

export default useUserOrders;
