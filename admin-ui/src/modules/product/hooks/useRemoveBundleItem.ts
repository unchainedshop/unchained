import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveBundleItemMutation,
  IRemoveBundleItemMutationVariables,
} from '../../../gql/types';

const RemoveBundleItemMutation = gql`
  mutation RemoveBundleItem($productId: ID!, $index: Int!) {
    removeBundleItem(productId: $productId, index: $index) {
      _id
    }
  }
`;

const useRemoveBundleItem = () => {
  const [removeBundleItemMutation] = useMutation<
    IRemoveBundleItemMutation,
    IRemoveBundleItemMutationVariables
  >(RemoveBundleItemMutation);

  const removeBundleItem = async ({
    productId,
    index,
  }: IRemoveBundleItemMutationVariables) => {
    return removeBundleItemMutation({
      variables: { productId, index },
      refetchQueries: ['ProductBundleItems'],
    });
  };

  return {
    removeBundleItem,
  };
};

export default useRemoveBundleItem;
