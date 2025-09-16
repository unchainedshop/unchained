import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IReorderAssortmentLinksMutation,
  IReorderAssortmentLinksMutationVariables,
} from '../../../gql/types';

const ReorderAssortmentLinkMutation = gql`
  mutation ReorderAssortmentLinks($sortKeys: [ReorderAssortmentLinkInput!]!) {
    reorderAssortmentLinks(sortKeys: $sortKeys) {
      _id
      sortKey
    }
  }
`;

const useReorderAssortmentLink = () => {
  const [reorderAssortmentLinkMutation] = useMutation<
    IReorderAssortmentLinksMutation,
    IReorderAssortmentLinksMutationVariables
  >(ReorderAssortmentLinkMutation);

  const reorderAssortmentLink = async ({
    sortKeys,
  }: IReorderAssortmentLinksMutationVariables) => {
    return reorderAssortmentLinkMutation({
      variables: { sortKeys },
      refetchQueries: ['AssortmentLinks'],
    });
  };

  return {
    reorderAssortmentLink,
  };
};

export default useReorderAssortmentLink;
