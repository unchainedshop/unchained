import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateAssortmentTextsMutation,
  IUpdateAssortmentTextsMutationVariables,
} from '../../../gql/types';
import AssortmentTextsFragment from '../fragments/AssortmentTextsFragment';

const UpdateAssortmentTextsMutation = gql`
  mutation updateAssortmentTexts(
    $assortmentId: ID!
    $texts: [AssortmentTextInput!]!
  ) {
    updateAssortmentTexts(assortmentId: $assortmentId, texts: $texts) {
      ...AssortmentTextsFragment
    }
  }
  ${AssortmentTextsFragment}
`;

const useUpdateAssortmentTexts = () => {
  const [updateAssortmentTextsMutation] = useMutation<
    IUpdateAssortmentTextsMutation,
    IUpdateAssortmentTextsMutationVariables
  >(UpdateAssortmentTextsMutation);

  const updateAssortmentTexts = async ({
    assortmentId,
    texts,
  }: IUpdateAssortmentTextsMutationVariables) => {
    return updateAssortmentTextsMutation({
      variables: { assortmentId, texts },
      refetchQueries: ['TranslatedAssortmentTexts', 'Assortment'],
    });
  };

  return {
    updateAssortmentTexts,
  };
};

export default useUpdateAssortmentTexts;
