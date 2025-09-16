import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductReviewVoteMutation,
  IRemoveProductReviewVoteMutationVariables,
} from '../../../gql/types';
import ProductReviewDetailFragment from '../fragments/ProductReviewDetailFragment';
import { ProductReviewVoteType } from './useAddProductReviewVote';

const RemoveProductReviewVoteMutation = gql`
  mutation RemoveProductReviewVote(
    $productReviewId: ID!
    $type: ProductReviewVoteType!
  ) {
    removeProductReviewVote(productReviewId: $productReviewId, type: $type) {
      ...ProductReviewDetailFragment
    }
  }
  ${ProductReviewDetailFragment}
`;

const useRemoveProductReviewVote = () => {
  const [removeProductReviewVoteMutation] = useMutation<
    IRemoveProductReviewVoteMutation,
    IRemoveProductReviewVoteMutationVariables
  >(RemoveProductReviewVoteMutation);

  const removeProductReviewVote = async ({
    productReviewId,
    type,
  }: IRemoveProductReviewVoteMutationVariables) => {
    return removeProductReviewVoteMutation({
      variables: {
        productReviewId,
        type,
      },
      refetchQueries: ['ProductReviewByProduct', 'ProductReviewByUser'],
    });
  };

  return {
    removeProductReviewVote,
  };
};

export default useRemoveProductReviewVote;
