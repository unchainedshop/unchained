import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IFilterQuery, IFilterQueryVariables } from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import FilterFragment from '../fragments/FilterFragment';

const GetFilterQuery = (inlineFragment = '') => gql`
  query Filter($filterId: ID) {
    filter(filterId: $filterId) {
      ...FilterFragment
      ${inlineFragment}
      texts {
        _id
        title
        subtitle
        locale
      }
    }
  }
  ${FilterFragment}
`;

const useFilter = ({ filterId = null }: IFilterQueryVariables = {}) => {
  const { customProperties, hydrateFragment } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    IFilterQuery,
    IFilterQueryVariables
  >(GetFilterQuery(customProperties?.Filter), {
    skip: !filterId,
    variables: { filterId },
  });

  const filter = data?.filter;
  const extendedData = hydrateFragment(customProperties?.Filter, filter);

  return {
    filter,
    loading,
    error,
    extendedData,
  };
};

export default useFilter;
