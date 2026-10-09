import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ILinkAssortmentMediaMutation,
  ILinkAssortmentMediaMutationVariables,
} from '../../../gql/types';

const LinkAssortmentMediaMutation = gql`
  mutation LinkAssortmentMedia($assortmentId: ID!, $mediaId: ID!) {
    linkAssortmentMedia(assortmentId: $assortmentId, mediaId: $mediaId) {
      _id
    }
  }
`;

const useLinkAssortmentMedia = () => {
  const [linkAssortmentMediaMutation] = useMutation<
    ILinkAssortmentMediaMutation,
    ILinkAssortmentMediaMutationVariables
  >(LinkAssortmentMediaMutation, {
    refetchQueries: ['Assortment'],
  });

  const linkAssortmentMedia = async (
    variables: ILinkAssortmentMediaMutationVariables,
  ) => {
    return linkAssortmentMediaMutation({ variables });
  };

  return { linkAssortmentMedia };
};

export default useLinkAssortmentMedia;
