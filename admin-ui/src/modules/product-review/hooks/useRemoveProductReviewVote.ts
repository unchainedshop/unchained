import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductReviewVoteMutation,
  IRemoveProductReviewVoteMutationVariables,
} from '../../../gql/types';

const RemoveProductReviewVoteMutation = gql`
  mutation RemoveProductReviewVote(
    $productReviewId: ID!
    $type: ProductReviewVoteType!
    $forceLocale: Locale
  ) {
    removeProductReviewVote(productReviewId: $productReviewId, type: $type) {
      _id
    }
  }
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
