import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ILinkProductMediaMutation,
  ILinkProductMediaMutationVariables,
} from '../../../gql/types';

const LinkProductMediaMutation = gql`
  mutation LinkProductMedia($productId: ID!, $mediaId: ID!) {
    linkProductMedia(productId: $productId, mediaId: $mediaId) {
      _id
    }
  }
`;

const useLinkProductMedia = () => {
  const [linkProductMediaMutation] = useMutation<
    ILinkProductMediaMutation,
    ILinkProductMediaMutationVariables
  >(LinkProductMediaMutation, {
    refetchQueries: ['Product'],
  });

  const linkProductMedia = async (
    variables: ILinkProductMediaMutationVariables,
  ) => {
    return linkProductMediaMutation({ variables });
  };

  return { linkProductMedia };
};

export default useLinkProductMedia;
