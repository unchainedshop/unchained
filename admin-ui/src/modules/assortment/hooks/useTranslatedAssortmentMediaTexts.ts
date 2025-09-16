import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ITranslatedAssortmentMediaTextsQuery,
  ITranslatedAssortmentMediaTextsQueryVariables,
} from '../../../gql/types';

import AssortmentMediaTextsFragment from '../fragments/AssortmentMediaTextsFragment';

const TranslatedAssortmentMediaTextsQuery = gql`
  query TranslatedAssortmentMediaTexts($assortmentMediaId: ID!) {
    translatedAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId) {
      ...AssortmentMediaTextsFragment
    }
  }
  ${AssortmentMediaTextsFragment}
`;

const useTranslatedAssortmentMediaTexts = ({
  assortmentMediaId = null,
}: ITranslatedAssortmentMediaTextsQueryVariables) => {
  const { data, loading, error } = useQuery<
    ITranslatedAssortmentMediaTextsQuery,
    ITranslatedAssortmentMediaTextsQueryVariables
  >(TranslatedAssortmentMediaTextsQuery, {
    skip: !assortmentMediaId,
    variables: {
      assortmentMediaId,
    },
  });
  const translatedAssortmentMediaTexts =
    data?.translatedAssortmentMediaTexts || [];

  return {
    loading,
    error,
    translatedAssortmentMediaTexts,
  };
};

export default useTranslatedAssortmentMediaTexts;
