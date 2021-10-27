export default [
  /* GraphQL */ `
    """
    A Bundle product consists of multiple configured products
    """
    type BundleProduct implements Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: DateTime
      updated: DateTime
      published: DateTime
      media(limit: Int = 10, offset: Int = 0, tags: [String!]): [ProductMedia!]!
      texts(forceLocale: String): ProductTexts
      bundleItems: [ProductBundleItem!]
      reviews(limit: Int = 10, offset: Int = 0): [ProductReview!]!
      assortmentPaths: [ProductAssortmentPath!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
    }

    type ProductBundleItem {
      product: Product!
      quantity: Int!
      configuration: [ProductConfigurationParameter!]
    }
  `,
];
