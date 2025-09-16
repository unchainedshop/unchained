import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateCountryMutation,
  ICreateCountryMutationVariables,
} from '../../../gql/types';
import CountryFragment from '../fragments/CountryFragment';

const CreateCountryMutation = gql`
  mutation CreateCountry($country: CreateCountryInput!) {
    createCountry(country: $country) {
      ...CountryFragment
    }
  }
  ${CountryFragment}
`;

const useCreateCountry = () => {
  const [createCountryMutation, { data, loading, error }] = useMutation<
    ICreateCountryMutation,
    ICreateCountryMutationVariables
  >(CreateCountryMutation);

  const createCountry = async ({
    country,
  }: ICreateCountryMutationVariables) => {
    return createCountryMutation({
      variables: { country },
      refetchQueries: ['Countries', 'ShopStatus', 'ShopInfo'],
    });
  };
  const newCountry = data?.createCountry;
  return {
    createCountry,
    newCountry,
    loading,
    error,
  };
};

export default useCreateCountry;
