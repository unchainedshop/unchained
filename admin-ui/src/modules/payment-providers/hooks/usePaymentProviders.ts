import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IPaymentProvidersQuery,
  IPaymentProvidersQueryVariables,
} from '../../../gql/types';
import PaymentProviderFragment from '../fragments/PaymentProviderFragment';

const PaymentProvidersQuery = gql`
  query PaymentProviders($type: PaymentProviderType) {
    paymentProviders(type: $type) {
      ...PaymentProviderFragment
    }
    paymentProvidersCount(type: $type)
  }
  ${PaymentProviderFragment}
`;

const usePaymentProviders = ({
  type = null,
}: IPaymentProvidersQueryVariables = {}) => {
  const variables: any = {};
  if (type) variables.type = type;

  const { data, loading, error }: any = useQuery<
    IPaymentProvidersQuery,
    IPaymentProvidersQueryVariables
  >(PaymentProvidersQuery, {
    variables,
  });

  const paymentProviders = data?.paymentProviders || [];

  return {
    paymentProviders,
    loading,
    error,
    paymentProvidersCount: data?.paymentProvidersCount || 0,
  };
};

export default usePaymentProviders;
