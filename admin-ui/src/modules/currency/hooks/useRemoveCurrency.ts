import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveCurrencyMutation,
  IRemoveCurrencyMutationVariables,
} from '../../../gql/types';
import CurrencyFragment from '../fragments/CurrencyFragment';

const RemoveCurrencyMutation = gql`
  mutation RemoveCurrency($currencyId: ID!) {
    removeCurrency(currencyId: $currencyId) {
      ...CurrencyFragment
    }
  }
  ${CurrencyFragment}
`;

const useRemoveCurrency = () => {
  const [removeCurrencyMutation] = useMutation<
    IRemoveCurrencyMutation,
    IRemoveCurrencyMutationVariables
  >(RemoveCurrencyMutation);

  const removeCurrency = async ({
    currencyId,
  }: IRemoveCurrencyMutationVariables) => {
    return removeCurrencyMutation({
      variables: { currencyId },
      refetchQueries: ['Currencies', 'ShopStatus', 'ShopInfo'],
    });
  };

  return {
    removeCurrency,
  };
};

export default useRemoveCurrency;
