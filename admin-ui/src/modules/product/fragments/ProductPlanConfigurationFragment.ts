import { gql } from '@apollo/client';

const ProductPlanConfigurationFragment = gql`
  fragment ProductPlanConfigurationFragment on ProductPlanConfiguration {
    usageCalculationType
    billingInterval
    trialInterval
    trialIntervalCount
    billingIntervalCount
  }
`;

export default ProductPlanConfigurationFragment;
