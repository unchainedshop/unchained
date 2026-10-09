import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

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
  const [linkUserAvatarMutation] = useMutation(LinkUserAvatarMutation, {
    refetchQueries: ['User', 'CurrentUser'],
  });

  const linkUserAvatar = async ({
    userId,
    mediaId,
  }: {
    userId: string;
    mediaId: string;
  }) => {
    return linkUserAvatarMutation({
      variables: { userId, mediaId },
    });
  };

  return { linkUserAvatar };
};

export default useLinkUserAvatar;
