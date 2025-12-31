import { gql } from '@apollo/client';

const ProductReviewDetailFragment = gql`
  fragment ProductReviewDetailFragment on ProductReview {
    _id
    created
    updated
    deleted
    author {
      _id
      username
      name
      profile {
        displayName
        address {
          firstName
          lastName
        }
      }
      isGuest
      avatar {
        _id

        url
      }
    }
    product {
      _id
      texts {
        _id
        title
        subtitle
      }
      media {
        _id
        file {
          _id
          url
        }
      }
    }
    rating
    title
    review
    upVote: voteCount(type: UPVOTE)
    downVote: voteCount(type: DOWNVOTE)
    voteReport: voteCount(type: REPORT)
    ownVotes {
      timestamp
      type
    }
  }
`;

export default ProductReviewDetailFragment;
