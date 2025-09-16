import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IOrderQuery, IOrderQueryVariables } from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import OrderDetailFragment from '../fragments/OrderDetailFragment';

const GetOrderQuery = (inlineFragment = '') => gql`
  query Order($orderId: ID!) {
    order(orderId: $orderId) {
      ...OrderDetailFragment
      ${inlineFragment}
    }
  }
  ${OrderDetailFragment}
`;

const useOrder = ({ orderId = null }: IOrderQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<IOrderQuery, IOrderQueryVariables>(
    GetOrderQuery(customProperties?.Order),
    {
      skip: !orderId,

      variables: { orderId },
    },
  );

  return {
    order: data?.order,
    loading,
    error,
  };
};

export default useOrder;
