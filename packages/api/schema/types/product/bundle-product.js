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
      created: Date
      updated: Date
      published: Date
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
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
    }

    type ProductBundleItem {
      product: Product!
      quantity: Int!
      configuration: [ProductConfigurationParameter!]
    }
  `,
];
