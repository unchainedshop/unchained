import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const LinkAssortmentMediaMutation = gql`
  mutation LinkAssortmentMedia($assortmentId: ID!, $mediaId: ID!) {
    linkAssortmentMedia(assortmentId: $assortmentId, mediaId: $mediaId) {
      _id
    }
  }
`;

const useLinkAssortmentMedia = () => {
  const [linkAssortmentMediaMutation] = useMutation(
    LinkAssortmentMediaMutation,
    {
      refetchQueries: ['Assortment'],
    },
  );

  const linkAssortmentMedia = async ({
    assortmentId,
    mediaId,
  }: {
    assortmentId: string;
    mediaId: string;
  }) => {
    return linkAssortmentMediaMutation({
      variables: { assortmentId, mediaId },
    });
  };

  return { linkAssortmentMedia };
};

export default useLinkAssortmentMedia;
