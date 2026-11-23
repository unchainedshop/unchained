import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateCurrencyMutation,
  IUpdateCurrencyMutationVariables,
} from '../../../gql/types';
import CurrencyFragment from '../fragments/CurrencyFragment';

const UpdateCurrencyMutation = gql`
  mutation UpdateCurrency($currency: UpdateCurrencyInput!, $currencyId: ID!) {
    updateCurrency(currency: $currency, currencyId: $currencyId) {
      ...CurrencyFragment
    }
  }
  ${CurrencyFragment}
`;

const useUpdateCurrency = () => {
  const [updateCurrencyMutation] = useMutation<
    IUpdateCurrencyMutation,
    IUpdateCurrencyMutationVariables
  >(UpdateCurrencyMutation);

  const updateCurrency = async ({
    currency: { isoCode, isActive, contractAddress },
    currencyId,
  }: IUpdateCurrencyMutationVariables) => {
    return updateCurrencyMutation({
      variables: {
        currency: {
          isoCode,
          isActive,
          contractAddress,
        },
        currencyId,
      },
      refetchQueries: ['Currencies', 'ShopStatus', 'ShopInfo'],
    });
  };

  return {
    updateCurrency,
  };
};

export default useUpdateCurrency;
