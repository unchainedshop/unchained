import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveAssortmentLinkMutation,
  IRemoveAssortmentLinkMutationVariables,
} from '../../../gql/types';
import AssortmentLinkFragment from '../fragments/AssortmentLinkFragment';

const RemoveAssortmentLinkMutation = gql`
  mutation RemoveAssortmentLink($assortmentLinkId: ID!) {
    removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
      ...AssortmentLinkFragment
    }
  }
  ${AssortmentLinkFragment}
`;

const useRemoveAssortmentLink = () => {
  const [removeAssortmentLinkMutation] = useMutation<
    IRemoveAssortmentLinkMutation,
    IRemoveAssortmentLinkMutationVariables
  >(RemoveAssortmentLinkMutation);

  const removeAssortmentLink = async ({
    assortmentLinkId,
  }: IRemoveAssortmentLinkMutationVariables) => {
    return removeAssortmentLinkMutation({
      variables: { assortmentLinkId },
      refetchQueries: ['AssortmentLinks'],
    });
  };

  return {
    removeAssortmentLink,
  };
};

export default useRemoveAssortmentLink;
