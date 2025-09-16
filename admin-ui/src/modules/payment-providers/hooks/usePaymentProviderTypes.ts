import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IPaymentProvidersQueryVariables,
  IPaymentProvidersTypeQuery,
} from '../../../gql/types';

const PaymentProvidersTypeQuery = gql`
  query PaymentProvidersType {
    paymentProviderType: __type(name: "PaymentProviderType") {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

const usePaymentProviderTypes = () => {
  const { data, loading, error } = useQuery<
    IPaymentProvidersTypeQuery,
    IPaymentProvidersQueryVariables
  >(PaymentProvidersTypeQuery);

  const paymentProviderType = data?.paymentProviderType?.options || [];

  return {
    paymentProviderType,
    loading,
    error,
  };
};

export default usePaymentProviderTypes;
