import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ILinkUserAvatarMutation,
  ILinkUserAvatarMutationVariables,
} from '../../../gql/types';

const LinkUserAvatarMutation = gql`
  mutation LinkUserAvatar($userId: ID!, $mediaId: ID!) {
    linkUserAvatar(userId: $userId, mediaId: $mediaId) {
      _id
      avatar {
        _id
        url
        name
      }
    }
  }
`;

const useLinkUserAvatar = () => {
  const [linkUserAvatarMutation] = useMutation<
    ILinkUserAvatarMutation,
    ILinkUserAvatarMutationVariables
  >(LinkUserAvatarMutation, {
    refetchQueries: ['User', 'CurrentUser'],
  });

  const linkUserAvatar = async (
    variables: ILinkUserAvatarMutationVariables,
  ) => {
    return linkUserAvatarMutation({ variables });
  };

  return { linkUserAvatar };
};

export default useLinkUserAvatar;
