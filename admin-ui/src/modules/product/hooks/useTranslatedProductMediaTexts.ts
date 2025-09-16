import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ITranslatedProductMediaTextsQuery,
  ITranslatedProductMediaTextsQueryVariables,
} from '../../../gql/types';
import ProductMediaTextsFragment from '../fragments/ProductMediaTextsFragment';

const TranslatedProductMediaTextsQuery = gql`
  query TranslatedProductMediaTexts($productMediaId: ID!) {
    translatedProductMediaTexts(productMediaId: $productMediaId) {
      ...ProductMediaTextsFragment
    }
  }
  ${ProductMediaTextsFragment}
`;

const useTranslatedProductMediaTexts = ({
  productMediaId,
}: ITranslatedProductMediaTextsQueryVariables) => {
  const { data, loading, error } = useQuery<
    ITranslatedProductMediaTextsQuery,
    ITranslatedProductMediaTextsQueryVariables
  >(TranslatedProductMediaTextsQuery, {
    skip: !productMediaId,
    variables: {
      productMediaId,
    },
  });
  const translatedMediaTexts = data?.translatedProductMediaTexts || [];

  return {
    translatedMediaTexts,
    loading,
    error,
  };
};

export default useTranslatedProductMediaTexts;
