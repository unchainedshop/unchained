import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ITranslatedAssortmentTextsQuery,
  ITranslatedAssortmentTextsQueryVariables,
} from '../../../gql/types';

import AssortmentTextsFragment from '../fragments/AssortmentTextsFragment';

const TranslatedAssortmentTextsQuery = gql`
  query TranslatedAssortmentTexts($assortmentId: ID!) {
    translatedAssortmentTexts(assortmentId: $assortmentId) {
      ...AssortmentTextsFragment
    }
  }
  ${AssortmentTextsFragment}
`;

const useTranslatedAssortmentTexts = ({
  assortmentId = null,
}: ITranslatedAssortmentTextsQueryVariables) => {
  const { data, loading, error } = useQuery<
    ITranslatedAssortmentTextsQuery,
    ITranslatedAssortmentTextsQueryVariables
  >(TranslatedAssortmentTextsQuery, {
    skip: !assortmentId,
    variables: {
      assortmentId,
    },
  });
  const translatedAssortmentTexts = data?.translatedAssortmentTexts || [];

  return {
    loading,
    error,
    translatedAssortmentTexts,
  };
};

export default useTranslatedAssortmentTexts;
