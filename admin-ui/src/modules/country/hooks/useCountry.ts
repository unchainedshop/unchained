import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ICountryQuery, ICountryQueryVariables } from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import CountryFragment from '../fragments/CountryFragment';

const GetCountryQuery = (inlineFragment = '') => gql`
  query Country($countryId: ID!) {
    country(countryId: $countryId) {
      ...CountryFragment
      ${inlineFragment}
    }
  }
  ${CountryFragment}
`;

const useCountry = ({ countryId }: ICountryQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    ICountryQuery,
    ICountryQueryVariables
  >(GetCountryQuery(customProperties?.Country), {
    skip: !countryId,
    variables: { countryId },
  });

  return {
    country: data?.country,
    loading,
    error,
  };
};

export default useCountry;
