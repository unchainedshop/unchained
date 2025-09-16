import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IOrderStatusQuery,
  IOrderStatusQueryVariables,
} from '../../../gql/types';

const OrderStatusTypesQuery = gql`
  query OrderStatus {
    orderStatusType: __type(name: "OrderStatus") {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

const useOrderStatusTypes = () => {
  const { data, loading, error } = useQuery<
    IOrderStatusQuery,
    IOrderStatusQueryVariables
  >(OrderStatusTypesQuery);

  const orderStatusType = data?.orderStatusType?.options || [];

  return {
    orderStatusType,
    loading,
    error,
  };
};

export default useOrderStatusTypes;
