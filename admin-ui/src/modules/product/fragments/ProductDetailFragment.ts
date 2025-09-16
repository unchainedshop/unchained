import { gql } from '@apollo/client';

const ProductDetailFragment = gql`
  fragment ProductDetailFragment on Product {
    _id
    sequence
    status
    created
    tags
    updated
    published

    media {
      _id
      tags
      file {
        _id
        url
      }
    }
    reviews {
      _id
      created
      author {
        _id
        username
        isGuest
      }
      rating
      title
      review
      voteCount
      ownVotes {
        type
        timestamp
      }
    }
    siblings {
      _id
      media {
        _id
        file {
          _id
          url
        }
      }
    }
  }
`;

export default ProductDetailFragment;
