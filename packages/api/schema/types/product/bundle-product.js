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
      media(vectors: [ProductAssignmentVectorInput!]): [ProductMedia!]
      texts(forceLocale: String): ProductTexts
      bundleItems: [ProductBundleItem!]
      reviews(limit: Int, offset: Int): [ProductReview!]!
    }

    type ProductBundleItem {
      product: Product!
      quantity: Int!
      configuration: [ProductItemConfigurationParameterInput!]
    }
  `,
];
