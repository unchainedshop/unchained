import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductPlanMutation,
  IUpdateProductPlanMutationVariables,
} from '../../../gql/types';

const UpdateProductPlanMutation = gql`
  mutation UpdateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
    updateProductPlan(productId: $productId, plan: $plan) {
      _id
    }
  }
`;

const useUpdateProductPlan = () => {
  const [updateProductPlanMutation] = useMutation<
    IUpdateProductPlanMutation,
    IUpdateProductPlanMutationVariables
  >(UpdateProductPlanMutation);

  const updateProductPlan = async ({
    productId,
    plan: {
      usageCalculationType,
      billingInterval,
      billingIntervalCount = null,
      trialInterval = null,
      trialIntervalCount = null,
    },
  }: IUpdateProductPlanMutationVariables) => {
    return updateProductPlanMutation({
      variables: {
        productId,
        plan: {
          usageCalculationType,
          billingInterval,
          billingIntervalCount,
          trialInterval,
          trialIntervalCount,
        },
      },
      refetchQueries: ['Products'],
    });
  };

  return {
    updateProductPlan,
  };
};

export default useUpdateProductPlan;
