import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ILanguagesQuery, ILanguagesQueryVariables } from '../../../gql/types';
import LanguageFragment from '../fragments/LanguageFragment';

const LanguagesQuery = gql`
  query Languages(
    $queryString: String
    $offset: Int
    $limit: Int
    $includeInactive: Boolean
    $sort: [SortOptionInput!]
  ) {
    languages(
      queryString: $queryString
      offset: $offset
      limit: $limit
      includeInactive: $includeInactive
      sort: $sort
    ) {
      ...LanguageFragment
    }
    languagesCount(includeInactive: $includeInactive, queryString: $queryString)
  }
  ${LanguageFragment}
`;

const useLanguages = ({
  queryString = '',
  limit = 20,
  offset = 0,
  includeInactive = true,
  sort = [],
}: ILanguagesQueryVariables = {}) => {
  const { data, loading, error, fetchMore } = useQuery<
    ILanguagesQuery,
    ILanguagesQueryVariables
  >(LanguagesQuery, {
    variables: { queryString, limit, offset, includeInactive, sort },
  });
  const languages = data?.languages || [];
  const languagesCount = data?.languagesCount;
  const hasMore = languages?.length < languagesCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: languages?.length },
    });
  };

  return {
    languages,
    languagesCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useLanguages;
