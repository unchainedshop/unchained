import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ICurrencyQuery, ICurrencyQueryVariables } from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import CurrencyFragment from '../fragments/CurrencyFragment';

const GetCurrencyQuery = (inlineFragment = '') => gql`
  query Currency($currencyId: ID!) {
    currency(currencyId: $currencyId) {
      ...CurrencyFragment
      ${inlineFragment}
    }
  }
  ${CurrencyFragment}
`;

const useCurrency = ({ currencyId }: ICurrencyQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    ICurrencyQuery,
    ICurrencyQueryVariables
  >(GetCurrencyQuery(customProperties?.Currency), {
    skip: !currencyId,
    variables: { currencyId },
  });

  return {
    currency: data?.currency,
    loading,
    error,
  };
};

export default useCurrency;
