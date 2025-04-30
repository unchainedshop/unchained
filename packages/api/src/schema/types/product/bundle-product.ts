export default [
  /* GraphQL */ `
    """
    A Bundle product consists of multiple configured products
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
      bundleItems: [ProductBundleItem!]
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
      reviewsCount(queryString: String): Int!
      assortmentPaths: [ProductAssortmentPath!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
    }

    type ProductBundleItem @cacheControl(maxAge: 180) {
      product: Product!
      quantity: Int!
      configuration: [ProductConfigurationParameter!]
    }
  `,
];
