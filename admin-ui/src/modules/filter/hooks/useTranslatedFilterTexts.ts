import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ITranslatedFilterTextsQuery,
  ITranslatedFilterTextsQueryVariables,
} from '../../../gql/types';

import FilterTextsFragment from '../fragments/FilterTextsFragment';

export const TranslatedFilterTextsQuery = gql`
  query TranslatedFilterTexts($filterId: ID!, $filterOptionValue: String) {
    translatedFilterTexts(
      filterId: $filterId
      filterOptionValue: $filterOptionValue
    ) {
      ...FilterTextsFragment
    }
  }
  ${FilterTextsFragment}
`;

const useTranslatedFilterTexts = ({
  filterId = null,
  filterOptionValue = null,
}: ITranslatedFilterTextsQueryVariables) => {
  const { data, loading, error } = useQuery<
    ITranslatedFilterTextsQuery,
    ITranslatedFilterTextsQueryVariables
  >(TranslatedFilterTextsQuery, {
    variables: { filterId, filterOptionValue },
  });

  return {
    translatedFilterTexts: data?.translatedFilterTexts || [],
    loading,
    error,
  };
};

export default useTranslatedFilterTexts;
