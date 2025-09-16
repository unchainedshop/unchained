import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateAssortmentMutation,
  IUpdateAssortmentMutationVariables,
} from '../../../gql/types';
import AssortmentFragment from '../fragments/AssortmentFragment';

const UpdateAssortmentMutation = gql`
  mutation UpdateAssortment(
    $assortment: UpdateAssortmentInput!
    $assortmentId: ID!
  ) {
    updateAssortment(assortment: $assortment, assortmentId: $assortmentId) {
      ...AssortmentFragment
    }
  }
  ${AssortmentFragment}
`;

const useUpdateAssortment = () => {
  const [updateAssortmentMutation] = useMutation<
    IUpdateAssortmentMutation,
    IUpdateAssortmentMutationVariables
  >(UpdateAssortmentMutation);

  const updateAssortment = async ({
    assortmentId,
    assortment: { isRoot, tags, sequence, isActive },
  }: IUpdateAssortmentMutationVariables) => {
    return updateAssortmentMutation({
      variables: {
        assortment: { isRoot, tags, sequence, isActive },
        assortmentId,
      },
      refetchQueries: ['Assortments', 'Assortment'],
    });
  };

  return {
    updateAssortment,
  };
};

export default useUpdateAssortment;
