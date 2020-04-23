export default [
  /* GraphQL */ `
    """
    Configurable Product (Proxy)
    """
    type ConfigurableProduct implements Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: Date
      updated: Date
      published: Date
      media(limit: Int = 10, offset: Int = 0, tags: [String!]): [ProductMedia!]!
      texts(forceLocale: String): ProductTexts
      assortmentPaths: [ProductAssortmentPath!]!
      reviews(limit: Int = 10, offset: Int = 0): [ProductReview!]!

      """
      Reduced list of possible products by key/value combinations
      """
      products(
        vectors: [ProductAssignmentVectorInput!]
        includeInactive: Boolean = false
      ): [Product!]

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
  `,
];
