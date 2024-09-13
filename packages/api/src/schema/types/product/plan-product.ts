export default [
  /* GraphQL */ `
    enum ProductPlanConfigurationInterval {
      HOURS
      DAYS
      WEEKS
      MONTHS
      YEARS
    }

    enum ProductPlanUsageCalculationType {
      LICENSED
      METERED
    }

    type ProductPlanConfiguration @cacheControl(maxAge: 180) {
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
    Plan (Virtual Product that somebody can enroll to)
    """
    type PlanProduct implements Product @cacheControl(maxAge: 180) {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [LowerCaseString!]
      created: DateTime
      updated: DateTime
      published: DateTime
      media(limit: Int = 10, offset: Int = 0, tags: [LowerCaseString!]): [ProductMedia!]!
      texts(forceLocale: String): ProductTexts
      catalogPrice(quantity: Int = 1, currency: String): Price
      leveledCatalogPrices(currency: String): [PriceLevel!]!
      simulatedPrice(
        currency: String
        useNetPrice: Boolean = false
        quantity: Int = 1
        configuration: [ProductConfigurationParameterInput!]
      ): Price @cacheControl(scope: PRIVATE)
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
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
      reviewsCount(queryString: String): Int!
      plan: ProductPlanConfiguration
    }
  `,
];
