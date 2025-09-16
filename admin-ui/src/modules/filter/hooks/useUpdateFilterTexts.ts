import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateFilterTextsMutation,
  IUpdateFilterTextsMutationVariables,
} from '../../../gql/types';
import FilterTextsFragment from '../fragments/FilterTextsFragment';

const UpdateFilterTextsMutation = gql`
  mutation UpdateFilterTexts(
    $filterId: ID!
    $filterOptionValue: String
    $texts: [FilterTextInput!]!
  ) {
    updateFilterTexts(
      filterId: $filterId
      filterOptionValue: $filterOptionValue
      texts: $texts
    ) {
      ...FilterTextsFragment
    }
  }
  ${FilterTextsFragment}
`;

const useUpdateFilterTexts = () => {
  const [updateFilterTextsMutation] = useMutation<
    IUpdateFilterTextsMutation,
    IUpdateFilterTextsMutationVariables
  >(UpdateFilterTextsMutation);

  const updateFilterTexts = async ({
    filterId,
    filterOptionValue,
    texts,
  }: IUpdateFilterTextsMutationVariables) => {
    return updateFilterTextsMutation({
      variables: { filterOptionValue, filterId, texts },
      refetchQueries: ['TranslatedFilterTexts'],
    });
  };

  return {
    updateFilterTexts,
  };
};

export default useUpdateFilterTexts;
