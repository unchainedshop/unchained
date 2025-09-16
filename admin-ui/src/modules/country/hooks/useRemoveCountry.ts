import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveCountryMutation,
  IRemoveCountryMutationVariables,
} from '../../../gql/types';
import CountryFragment from '../fragments/CountryFragment';

const RemoveCountryMutation = gql`
  mutation RemoveCountry($countryId: ID!) {
    removeCountry(countryId: $countryId) {
      ...CountryFragment
    }
  }
  ${CountryFragment}
`;

const useRemoveCountry = () => {
  const [removeCountryMutation] = useMutation<
    IRemoveCountryMutation,
    IRemoveCountryMutationVariables
  >(RemoveCountryMutation);

  const removeCountry = async ({
    countryId,
  }: IRemoveCountryMutationVariables) => {
    return removeCountryMutation({
      variables: { countryId },
      refetchQueries: ['Countries', 'ShopStatus', 'ShopInfo'],
    });
  };

  return {
    removeCountry,
  };
};

export default useRemoveCountry;
