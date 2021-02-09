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
      usageCalculationType: ProductPlanUsageCalculationType!
      billingInterval: ProductPlanConfigurationInterval!
      billingIntervalCount: Int
      trialInterval: ProductPlanConfigurationInterval
      trialIntervalCount: Int
    }

    input UpdateProductPlanInput {
      usageCalculationType: ProductPlanUsageCalculationType!
      billingInterval: ProductPlanConfigurationInterval!
      billingIntervalCount: Int
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
      catalogPrice(quantity: Int = 1, currency: String): Price
      leveledCatalogPrices(currency: String): [PriceLevel!]!
      simulatedPrice(
        currency: String
        useNetPrice: Boolean = false
        quantity: Int = 1
      ): Price
      simulatedDiscounts(quantity: Int = 1): [ProductDiscount!]
      assortmentPaths(forceLocale: String): [ProductAssortmentPath!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
      salesUnit: String
      salesQuantityPerUnit: String
      defaultOrderQuantity: Int
      reviews(limit: Int = 10, offset: Int = 0): [ProductReview!]!
      meta: JSON
      plan: ProductPlanConfiguration
    }
  `,
];
