import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateCurrencyMutation,
  ICreateCurrencyMutationVariables,
} from '../../../gql/types';
import CurrencyFragment from '../fragments/CurrencyFragment';

const CreateCurrencyMutation = gql`
  mutation CreateCurrency($currency: CreateCurrencyInput!) {
    createCurrency(currency: $currency) {
      ...CurrencyFragment
    }
  }
  ${CurrencyFragment}
`;

const useCreateCurrency = () => {
  const [createCurrencyMutation, { data, loading, error }] = useMutation<
    ICreateCurrencyMutation,
    ICreateCurrencyMutationVariables
  >(CreateCurrencyMutation);

  const createCurrency = async ({
    currency: { isoCode, contractAddress, decimals },
  }: ICreateCurrencyMutationVariables) => {
    return createCurrencyMutation({
      variables: {
        currency: {
          isoCode,
          contractAddress,
          decimals: parseInt((decimals || '2') as string, 10),
        },
      },
      refetchQueries: ['Currencies', 'ShopStatus', 'ShopInfo'],
    });
  };
  const newCurrency = data?.createCurrency;

  return {
    createCurrency,
    newCurrency,
    error,
    loading,
  };
};

export default useCreateCurrency;
