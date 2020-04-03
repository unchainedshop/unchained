export default [
  /* GraphQL */ `
    enum ProductPlanConfigurationInterval {
      HOUR
      DAY
      WEEK
      MONTH
      YEAR
    }

    enum ProductPlanUsageCalculationType {
      LICENSED
      METERED
    }

    type ProductPlanConfiguration {
      billingInterval: ProductPlanConfigurationInterval!
      billingIntervalCount: Int
      usageCalculationType: ProductPlanUsageCalculationType
      trialInterval: ProductPlanConfigurationInterval
      trialIntervalCount: Int
    }

    input ProductPlanConfigurationInput {
      billingInterval: ProductPlanConfigurationInterval!
      billingIntervalCount: Int
      usageCalculationType: ProductPlanUsageCalculationType
      trialInterval: ProductPlanConfigurationInterval
      trialIntervalCount: Int
    }

    """
    Plan (Subscriptionable virtual Product)
    """
    type PlanProduct implements Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: Date
      updated: Date
      published: Date
      media(limit: Int = 10, offset: Int = 0, tags: [String!]): [ProductMedia!]!
      texts(forceLocale: String): ProductTexts
      catalogPrice(quantity: Int = 1): ProductPrice
      simulatedPrice(
        useNetPrice: Boolean = false
        quantity: Int = 1
      ): ProductPrice
      simulatedDiscounts(quantity: Int = 1): [ProductDiscount!]
      assortmentPaths(forceLocale: String): [ProductAssortmentPath!]!
      siblings(assortmentId: ID, limit: Int = 10, offset: Int = 0): [Product!]!
      salesUnit: String
      salesQuantityPerUnit: String
      reviews(limit: Int = 10, offset: Int = 0): [ProductReview!]!
      meta: JSON
      plan: ProductPlanConfiguration!
    }
  `,
];
