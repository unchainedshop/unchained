import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateProductReviewMutation,
  ICreateProductReviewMutationVariables,
} from '../../../gql/types';
import ProductReviewDetailFragment from '../fragments/ProductReviewDetailFragment';

const CreateProductReviewMutation = gql`
  mutation CreateProductReview(
    $productId: ID!
    $productReview: ProductReviewInput!
  ) {
    createProductReview(productId: $productId, productReview: $productReview) {
      ...ProductReviewDetailFragment
    }
  }
  ${ProductReviewDetailFragment}
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
