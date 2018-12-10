import React from 'react';
import { graphql } from 'react-apollo';
import {
  compose, pure, withHandlers, withState, mapProps,
} from 'recompose';
import gql from 'graphql-tag';
import { Image } from 'semantic-ui-react';
import Dropzone from 'react-dropzone';

const UploadAvatar = ({ avatarUrl, handleChange }) => (
  <div className="fixed-height">

    <Dropzone
      onDrop={handleChange}
      multiple={false}
      accept="image/*"
    >
      {({ getRootProps, getInputProps }) => {
        const inputProps = getInputProps();
        return (
          <div
            {...getRootProps()}
            style={{ border: 0 }}
            className="ui container"
          >
            <input {...inputProps} />
            <Image
              label={{ color: 'blue', corner: 'right', icon: 'edit' }}
              src={avatarUrl}
              width={150}
              height={150}
              bordered
              shape="rounded"
            />
          </div>
        );
      }}
    </Dropzone>
    <style jsx>
      {`
      .fixed-height {
        height: 150px;
      }
    `}
    </style>
  </div>
);

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
