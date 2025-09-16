import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemovePaymentProviderMutation,
  IRemovePaymentProviderMutationVariables,
} from '../../../gql/types';

const RemovePaymentProviderMutation = gql`
  mutation RemovePaymentProvider($paymentProviderId: ID!) {
    removePaymentProvider(paymentProviderId: $paymentProviderId) {
      _id
    }
  }
`;

const useRemovePaymentProvider = () => {
  const [removePaymentProviderMutation] = useMutation<
    IRemovePaymentProviderMutation,
    IRemovePaymentProviderMutationVariables
  >(RemovePaymentProviderMutation);

  const removePaymentProvider = async ({
    paymentProviderId,
  }: IRemovePaymentProviderMutationVariables) => {
    return removePaymentProviderMutation({
      variables: {
        paymentProviderId,
      },
      refetchQueries: ['PaymentProviders', 'ShopStatus'],
    });
  };

  return {
    removePaymentProvider,
  };
};

export default useRemovePaymentProvider;
