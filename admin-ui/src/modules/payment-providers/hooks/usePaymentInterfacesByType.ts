import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IPaymentInterfacesQuery,
  IPaymentInterfacesQueryVariables,
} from '../../../gql/types';

const PaymentInterfacesQuery = gql`
  query PaymentInterfaces($providerType: PaymentProviderType) {
    paymentInterfaces(type: $providerType) {
      _id
      value: _id
      label
    }
  }
`;

const usePaymentInterfacesByType = ({
  providerType,
}: IPaymentInterfacesQueryVariables) => {
  const { data, loading, error } = useQuery<
    IPaymentInterfacesQuery,
    IPaymentInterfacesQueryVariables
  >(PaymentInterfacesQuery, {
    skip: !providerType,
    variables: { providerType },
  });

  const paymentInterfaces = data?.paymentInterfaces || [];

  return {
    paymentInterfaces,
    loading,
    error,
  };
};

export default usePaymentInterfacesByType;
