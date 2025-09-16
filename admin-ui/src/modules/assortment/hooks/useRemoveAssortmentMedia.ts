import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveAssortmentMediaMutation,
  IRemoveAssortmentMediaMutationVariables,
} from '../../../gql/types';

const RemoveAssortmentMediaMutation = gql`
  mutation RemoveAssortmentMedia($assortmentMediaId: ID!) {
    removeAssortmentMedia(assortmentMediaId: $assortmentMediaId) {
      _id
    }
  }
`;

const useRemoveAssortmentMedia = () => {
  const [removeAssortmentMediaMutation] = useMutation<
    IRemoveAssortmentMediaMutation,
    IRemoveAssortmentMediaMutationVariables
  >(RemoveAssortmentMediaMutation);

  const removeAssortmentMedia = async ({
    assortmentMediaId,
  }: IRemoveAssortmentMediaMutationVariables) => {
    return removeAssortmentMediaMutation({
      variables: { assortmentMediaId },
      refetchQueries: ['AssortmentMedia'],
    });
  };

  return {
    removeAssortmentMedia,
  };
};

export default useRemoveAssortmentMedia;
