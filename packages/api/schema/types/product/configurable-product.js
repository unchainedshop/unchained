export default [
  /* GraphQL */ `
    """
    Matrix Product
    """
    type ConfigurableProduct implements Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: Date
      updated: Date
      published: Date
      media(vectors: [ProductAssignmentVectorInput!]): [ProductMedia!]
      texts(forceLocale: String): ProductTexts
      assortments(limit: Int = 10, offset: Int = 0): [Assortment!]!
        @deprecated(
          reason: "Please use assortmentPaths to get the parent assortments"
        )
      assortmentPaths(forceLocale: String): [ProductAssortmentPath!]!
      reviews(limit: Int = 10, offset: Int = 0): [ProductReview!]!

      """
      Reduced list of possible products by key/value combinations
      """
      products(vectors: [ProductAssignmentVectorInput!]): [Product!]

      """
      Product's variations (keys) and their options (values)
      """
      variations: [ProductVariation!]

      """
      Complete assignment matrix
      """
      assignments: [ProductVariationAssignment!]!
      meta: JSON
    }
  `
];
