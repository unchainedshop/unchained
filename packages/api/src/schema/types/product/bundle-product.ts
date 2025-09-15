export default [
  /* GraphQL */ `
    """
    A Bundle product consists of multiple products
    """
    type BundleProduct implements Product @cacheControl(maxAge: 180) {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [LowerCaseString!]
      created: DateTime
      updated: DateTime
      published: DateTime
      media(limit: Int = 10, offset: Int = 0, tags: [LowerCaseString!]): [ProductMedia!]!
      texts(forceLocale: Locale): ProductTexts
      catalogPrice(quantity: Int = 1, currencyCode: String): Price
      leveledCatalogPrices(currencyCode: String): [PriceLevel!]!
      simulatedPrice(
        currencyCode: String
        useNetPrice: Boolean = false
        quantity: Int = 1
        configuration: [ProductConfigurationParameterInput!]
      ): Price @cacheControl(scope: PRIVATE, maxAge: 10)
      salesUnit: String
      salesQuantityPerUnit: String
      defaultOrderQuantity: Int
      bundleItems: [ProductBundleItem!]
      assortmentPaths: [ProductAssortmentPath!]!
      proxies: [ConfigurableOrBundleProduct!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
      reviewsCount(queryString: String): Int!
    }

    type ProductBundleItem @cacheControl(maxAge: 180) {
      product: Product!
      quantity: Int!
      configuration: [ProductConfigurationParameter!]
    }
  `,
];
