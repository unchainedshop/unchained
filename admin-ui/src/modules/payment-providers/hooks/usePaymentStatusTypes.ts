import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IOrderPaymentStatusQuery,
  IOrderPaymentStatusQueryVariables,
} from '../../../gql/types';

const PaymentStatusTypesQuery = gql`
  query OrderPaymentStatus {
    paymentStatusTypes: __type(name: "OrderPaymentStatus") {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

const usePaymentStatusTypes = () => {
  const { data, loading, error } = useQuery<
    IOrderPaymentStatusQuery,
    IOrderPaymentStatusQueryVariables
  >(PaymentStatusTypesQuery);

  const paymentStatusTypes = data?.paymentStatusTypes?.options || [];

  return {
    paymentStatusTypes,
    loading,
    error,
  };
};

export default usePaymentStatusTypes;
