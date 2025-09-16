import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IReorderAssortmentMediaMutation,
  IReorderAssortmentMediaMutationVariables,
} from '../../../gql/types';

const ReorderAssortmentMediaMutation = gql`
  mutation ReorderAssortmentMedia($sortKeys: [ReorderAssortmentMediaInput!]!) {
    reorderAssortmentMedia(sortKeys: $sortKeys) {
      _id
      sortKey
    }
  }
`;

const useReorderAssortmentMedia = () => {
  const [reorderAssortmentMediaMutation] = useMutation<
    IReorderAssortmentMediaMutation,
    IReorderAssortmentMediaMutationVariables
  >(ReorderAssortmentMediaMutation);

  const reorderAssortmentMedia = async ({
    sortKeys,
  }: IReorderAssortmentMediaMutationVariables) => {
    return reorderAssortmentMediaMutation({
      variables: { sortKeys },
      refetchQueries: ['AssortmentMedia'],
    });
  };

  return {
    reorderAssortmentMedia,
  };
};

export default useReorderAssortmentMedia;
