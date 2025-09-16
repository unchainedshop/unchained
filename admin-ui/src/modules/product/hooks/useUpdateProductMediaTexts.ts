import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductMediaTextsMutation,
  IUpdateProductMediaTextsMutationVariables,
} from '../../../gql/types';
import ProductMediaTextsFragment from '../fragments/ProductMediaTextsFragment';

const UpdateProductMediaTextsMutation = gql`
  mutation UpdateProductMediaTexts(
    $productMediaId: ID!
    $texts: [ProductMediaTextInput!]!
  ) {
    updateProductMediaTexts(productMediaId: $productMediaId, texts: $texts) {
      ...ProductMediaTextsFragment
    }
  }
  ${ProductMediaTextsFragment}
`;

const useUpdateProductMediaTexts = () => {
  const [updateProductMediaTextsMutation] = useMutation<
    IUpdateProductMediaTextsMutation,
    IUpdateProductMediaTextsMutationVariables
  >(UpdateProductMediaTextsMutation);

  const updateProductMediaTexts = async ({
    productMediaId,
    texts,
  }: IUpdateProductMediaTextsMutationVariables) => {
    return updateProductMediaTextsMutation({
      variables: { productMediaId, texts },
      refetchQueries: ['TranslatedProductMediaTexts'],
    });
  };

  return {
    updateProductMediaTexts,
  };
};

export default useUpdateProductMediaTexts;
