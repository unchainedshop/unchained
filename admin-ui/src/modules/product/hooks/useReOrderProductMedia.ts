import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IReOrderProductMediaMutation,
  IReOrderProductMediaMutationVariables,
} from '../../../gql/types';

const ReOrderProductMediaMutation = gql`
  mutation ReOrderProductMedia($sortKeys: [ReorderProductMediaInput!]!) {
    reorderProductMedia(sortKeys: $sortKeys) {
      _id
    }
  }
`;

const useReOrderProductMedia = () => {
  const [reOrderProductMutation] = useMutation<
    IReOrderProductMediaMutation,
    IReOrderProductMediaMutationVariables
  >(ReOrderProductMediaMutation);

  const reOrderProductMedia = async ({
    sortKeys,
  }: IReOrderProductMediaMutationVariables) => {
    return reOrderProductMutation({
      variables: { sortKeys },
      refetchQueries: ['ProductMedia'],
    });
  };

  return {
    reOrderProductMedia,
  };
};

export default useReOrderProductMedia;
