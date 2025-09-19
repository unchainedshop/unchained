import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddAssortmentLinkMutation,
  IAddAssortmentLinkMutationVariables,
} from '../../../gql/types';
import AssortmentLinkFragment from '../fragments/AssortmentLinkFragment';

const AddAssortmentLinkMutation = gql`
  mutation AddAssortmentLink(
    $parentAssortmentId: ID!
    $childAssortmentId: ID!
    $tags: [LowerCaseString!]
  ) {
    addAssortmentLink(
      parentAssortmentId: $parentAssortmentId
      childAssortmentId: $childAssortmentId
      tags: $tags
    ) {
      ...AssortmentLinkFragment
    }
  }
  ${AssortmentLinkFragment}
`;

const useAddAssortmentLink = () => {
  const [addAssortmentLinkMutation] = useMutation<
    IAddAssortmentLinkMutation,
    IAddAssortmentLinkMutationVariables
  >(AddAssortmentLinkMutation);

  const addAssortmentLink = async ({
    parentAssortmentId,
    childAssortmentId,
    tags,
  }: IAddAssortmentLinkMutationVariables) => {
    return addAssortmentLinkMutation({
      variables: { parentAssortmentId, childAssortmentId, tags },
      refetchQueries: ['AssortmentLinks'],
    });
  };

  return {
    addAssortmentLink,
  };
};

export default useAddAssortmentLink;
