import { gql } from '@apollo/client';

const MediaFragment = gql`
  fragment MediaFragment on Media {
    _id
    name
    type
    size
    url
  }
`;

export default MediaFragment;
