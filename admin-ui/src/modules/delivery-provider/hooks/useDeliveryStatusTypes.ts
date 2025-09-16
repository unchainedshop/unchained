import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IOrderDeliveryStatusQuery,
  IOrderDeliveryStatusQueryVariables,
} from '../../../gql/types';

const DeliveryStatusTypesQuery = gql`
  query OrderDeliveryStatus {
    deliveryStatusType: __type(name: "OrderDeliveryStatus") {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

const useDeliveryStatusTypes = () => {
  const { data, loading, error } = useQuery<
    IOrderDeliveryStatusQuery,
    IOrderDeliveryStatusQueryVariables
  >(DeliveryStatusTypesQuery);

  const deliveryStatusType = data?.deliveryStatusType?.options || [];

  return {
    deliveryStatusType,
    loading,
    error,
  };
};

export default useDeliveryStatusTypes;
