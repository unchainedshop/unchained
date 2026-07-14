import { gql } from '@apollo/client';

const GlobalSearchProductFragment = gql`
  fragment GlobalSearchProductFragment on Product {
    _id
    __typename
    texts {
      _id
      title
      slug
    }
    media(limit: 1) {
      file {
        url
      }
    }
  }
`;

export default GlobalSearchProductFragment;
