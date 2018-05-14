import { graphql } from 'react-apollo';
import { compose, pure, withHandlers, withState, mapProps } from 'recompose';
import gql from 'graphql-tag';
import UploadAvatar from './UploadAvatar';

const FRAGMENT_AVATAR_FIELDS = gql`
  fragment avatarFields on User {
    _id
    avatar {
      _id
      url
    }
  }
`;

export default compose(
  withState('imageUrl', 'updateImageUrl', null),
  graphql(gql`
    query getProfile($userId: ID) {
      user(userId: $userId) {
        ...avatarFields
      }
    }
   ${FRAGMENT_AVATAR_FIELDS}
  `),
  graphql(gql`
    mutation updateUserAvatar ($avatar: Upload!, $userId: ID) {
      updateUserAvatar (avatar: $avatar, userId: $userId) {
        ...avatarFields
      }
    }
   ${FRAGMENT_AVATAR_FIELDS}
  `),
  withHandlers({
    handleChange: ({ mutate, userId, updateImageUrl }) => async (files) => {
      const avatar = files[0];
      updateImageUrl(URL.createObjectURL(avatar));
      await mutate({
        variables: {
          userId,
          avatar,
        },
      });
    },
  }),
  mapProps(({
    mutate, imageUrl, data: { user }, ...rest
  }) => ({
    avatarUrl: (imageUrl || (user && user.avatar && user.avatar.url)) || '/static/square-image.png',
    ...rest,
  })),
  pure,
)(UploadAvatar);
