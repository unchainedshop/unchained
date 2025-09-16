import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddAssortmentFilterMutation,
  IAddAssortmentFilterMutationVariables,
} from '../../../gql/types';

const AddAssortmentFilterMutation = gql`
  mutation AddAssortmentFilter(
    $assortmentId: ID!
    $filterId: ID!
    $tags: [LowerCaseString!]
  ) {
    addAssortmentFilter(
      assortmentId: $assortmentId
      filterId: $filterId
      tags: $tags
    ) {
      _id
    }
  }
`;

const useAddAssortmentFilter = () => {
  const [addAssortmentFilterMutation] = useMutation<
    IAddAssortmentFilterMutation,
    IAddAssortmentFilterMutationVariables
  >(AddAssortmentFilterMutation);

  const addAssortmentFilter = async ({
    assortmentId,
    filterId,
    tags,
  }: IAddAssortmentFilterMutationVariables) => {
    return addAssortmentFilterMutation({
      variables: { assortmentId, filterId, tags },
      refetchQueries: ['AssortmentFilters'],
    });
  };

  return {
    addAssortmentFilter,
  };
};

export default useAddAssortmentFilter;
