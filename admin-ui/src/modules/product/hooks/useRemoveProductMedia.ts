import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductMediaMutation,
  IRemoveProductMediaMutationVariables,
} from '../../../gql/types';

const RemoveProductMediaMutation = gql`
  mutation RemoveProductMedia($productMediaId: ID!) {
    removeProductMedia(productMediaId: $productMediaId) {
      _id
    }
  }
`;

const useRemoveProductMedia = () => {
  const [removeProductMediaMutation] = useMutation<
    IRemoveProductMediaMutation,
    IRemoveProductMediaMutationVariables
  >(RemoveProductMediaMutation);

  const removeProductMedia = async ({
    productMediaId,
  }: IRemoveProductMediaMutationVariables) => {
    return removeProductMediaMutation({
      variables: { productMediaId },
      refetchQueries: ['ProductMedia'],
    });
  };

  return {
    removeProductMedia,
  };
};

export default useRemoveProductMedia;
