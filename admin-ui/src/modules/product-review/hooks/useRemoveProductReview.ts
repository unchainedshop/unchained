import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductReviewMutation,
  IRemoveProductReviewMutationVariables,
} from '../../../gql/types';

const RemoveProductReviewMutation = gql`
  mutation RemoveProductReview($productReviewId: ID!) {
    removeProductReview(productReviewId: $productReviewId) {
      _id
    }
  }
`;

const useRemoveProductReview = () => {
  const [removeProductReviewMutation] = useMutation<
    IRemoveProductReviewMutation,
    IRemoveProductReviewMutationVariables
  >(RemoveProductReviewMutation);

  const removeProductReview = async ({
    productReviewId,
  }: IRemoveProductReviewMutationVariables) => {
    return removeProductReviewMutation({
      variables: {
        productReviewId,
      },
      refetchQueries: ['ProductReviewByProduct', 'ProductReviewByUser'],
    });
  };

  return {
    removeProductReview,
  };
};

export default useRemoveProductReview;
