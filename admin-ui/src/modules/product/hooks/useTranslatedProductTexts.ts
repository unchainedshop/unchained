import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ITranslatedProductTextsQuery,
  ITranslatedProductTextsQueryVariables,
} from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import ProductTextsFragment from '../fragments/ProductTextsFragment';

const GetTranslatedProductTextsQuery = (inlineFragment = '') => gql`
  query TranslatedProductTexts($productId: ID!) {
    translatedProductTexts(productId: $productId) {
      ...ProductTextsFragment
      ${inlineFragment}
    }
  }
  ${ProductTextsFragment}
`;

const useTranslatedProductTexts = ({
  productId,
}: ITranslatedProductTextsQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    ITranslatedProductTextsQuery,
    ITranslatedProductTextsQueryVariables
  >(GetTranslatedProductTextsQuery(customProperties?.ProductTexts), {
    skip: !productId,
    variables: {
      productId,
    },
  });
  const translatedTexts = data?.translatedProductTexts || [];

  return {
    translatedTexts,
    loading,
    error,
  };
};

export default useTranslatedProductTexts;
