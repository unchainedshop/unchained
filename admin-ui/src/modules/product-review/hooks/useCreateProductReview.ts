import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateProductReviewMutation,
  ICreateProductReviewMutationVariables,
} from '../../../gql/types';

const CreateProductReviewMutation = gql`
  mutation CreateProductReview(
    $productId: ID!
    $productReview: ProductReviewInput!
    $forceLocale: Locale
  ) {
    createProductReview(productId: $productId, productReview: $productReview) {
      _id
    }
  }
`;

const useCreateProductReview = () => {
  const [createProductReviewMutation] = useMutation<
    ICreateProductReviewMutation,
    ICreateProductReviewMutationVariables
  >(CreateProductReviewMutation);
  const createProductReview = async ({
    productId,
    productReview: { title, rating, review },
  }: ICreateProductReviewMutationVariables) => {
    return createProductReviewMutation({
      variables: {
        productId,
        productReview: {
          title,
          rating,
          review,
        },
      },
      refetchQueries: ['ProductReviewByProduct', 'ProductReviewByUser'],
    });
  };

  return {
    createProductReview,
  };
};

export default useCreateProductReview;
