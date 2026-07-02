import { gql } from '@apollo/client';

const BookmarkFragment = gql`
  fragment BookmarkFragment on Bookmark {
    _id
    created
    product {
      _id
      texts {
        _id
        title
        description
        slug
      }
      media(limit: 1) {
        file {
          url
        }
      }
      status
    }
  }
`;

export default BookmarkFragment;
