import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreatePaymentProviderMutation,
  ICreatePaymentProviderMutationVariables,
} from '../../../gql/types';
import PaymentProviderFragment from '../fragments/PaymentProviderFragment';

const CreatePaymentProviderMutation = gql`
  mutation CreatePaymentProvider(
    $paymentProvider: CreatePaymentProviderInput!
  ) {
    createPaymentProvider(paymentProvider: $paymentProvider) {
      ...PaymentProviderFragment
    }
  }
  ${PaymentProviderFragment}
`;

const useCreatePaymentProvider = () => {
  const [createPaymentProviderMutation, { data, loading, error }] = useMutation<
    ICreatePaymentProviderMutation,
    ICreatePaymentProviderMutationVariables
  >(CreatePaymentProviderMutation);

  const createPaymentProvider = async ({
    paymentProvider,
  }: ICreatePaymentProviderMutationVariables) => {
    return createPaymentProviderMutation({
      variables: { paymentProvider },
      refetchQueries: ['PaymentProviders', 'ShopStatus'],
    });
  };
  const newPaymentProvider = data?.createPaymentProvider;
  return {
    createPaymentProvider,
    newPaymentProvider,
    loading,
    error,
  };
};

export default useCreatePaymentProvider;
