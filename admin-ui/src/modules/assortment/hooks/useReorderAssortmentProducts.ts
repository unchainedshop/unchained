import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IReorderAssortmentProductsMutation,
  IReorderAssortmentProductsMutationVariables,
} from '../../../gql/types';

const ReorderAssortmentProductsMutation = gql`
  mutation ReorderAssortmentProducts(
    $sortKeys: [ReorderAssortmentProductInput!]!
  ) {
    reorderAssortmentProducts(sortKeys: $sortKeys) {
      _id
      sortKey
    }
  }
`;

const useReorderAssortmentProducts = () => {
  const [reorderAssortmentProductsMutation] = useMutation<
    IReorderAssortmentProductsMutation,
    IReorderAssortmentProductsMutationVariables
  >(ReorderAssortmentProductsMutation);

  const reorderAssortmentProducts = async ({
    sortKeys,
  }: IReorderAssortmentProductsMutationVariables) => {
    return reorderAssortmentProductsMutation({
      variables: { sortKeys },
      refetchQueries: ['AssortmentProducts'],
    });
  };

  return {
    reorderAssortmentProducts,
  };
};

export default useReorderAssortmentProducts;
