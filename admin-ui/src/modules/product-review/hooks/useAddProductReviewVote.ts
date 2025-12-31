import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddProductReviewVoteMutation,
  IAddProductReviewVoteMutationVariables,
} from '../../../gql/types';

export enum ProductReviewVoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
  REPORT = 'REPORT',
}
const AddProductReviewVoteMutation = gql`
  mutation AddProductReviewVote(
    $productReviewId: ID!
    $type: ProductReviewVoteType!
    $meta: JSON
  ) {
    addProductReviewVote(
      productReviewId: $productReviewId
      type: $type
      meta: $meta
    ) {
      _id
    }
  }
`;

const useAddProductReviewVote = () => {
  const [addProductReviewVoteMutation] = useMutation<
    IAddProductReviewVoteMutation,
    IAddProductReviewVoteMutationVariables
  >(AddProductReviewVoteMutation);
  const addProductReviewVote = async ({
    productReviewId,
    type,
    meta,
  }: IAddProductReviewVoteMutationVariables) => {
    return addProductReviewVoteMutation({
      variables: {
        productReviewId,
        type,
        meta,
      },
      refetchQueries: ['ProductReviewByProduct', 'ProductReviewByUser'],
    });
  };

  return {
    addProductReviewVote,
  };
};

export default useAddProductReviewVote;
