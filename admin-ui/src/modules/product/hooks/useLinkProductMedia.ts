import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const LinkProductMediaMutation = gql`
  mutation LinkProductMedia($productId: ID!, $mediaId: ID!) {
    linkProductMedia(productId: $productId, mediaId: $mediaId) {
      _id
    }
  }
`;

const useLinkProductMedia = () => {
  const [linkProductMediaMutation] = useMutation(LinkProductMediaMutation, {
    refetchQueries: ['Product'],
  });

  const linkProductMedia = async ({
    productId,
    mediaId,
  }: {
    productId: string;
    mediaId: string;
  }) => {
    return linkProductMediaMutation({
      variables: { productId, mediaId },
    });
  };

  return { linkProductMedia };
};

export default useLinkProductMedia;
