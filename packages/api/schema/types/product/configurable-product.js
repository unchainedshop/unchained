export default [
  /* GraphQL */ `
    enum ProductVariationType {
      """
      Color Picker
      """
      COLOR

      """
      Text Answers
      """
      TEXT
    }

    type ProductVariationTexts {
      _id: ID!
      locale: String
      title: String
      subtitle: String
    }

    type ProductVariationOption {
      _id: ID!
      texts(forceLocale: String): ProductVariationTexts
      value: String
    }

    type ProductVariation {
      _id: ID!
      texts(forceLocale: String): ProductVariationTexts
      type: ProductVariationType
      key: String
      options: [ProductVariationOption!]
    }

    """
    Key Value Combination
    """
    type ProductVariationAssignmentVector {
      _id: ID!
      variation: ProductVariation
      option: ProductVariationOption
    }

    """
    Key Value Combination to Product Assignment
    """
    type ProductVariationAssignment {
      _id: ID!

      """
      Query string key=val&key=val ...
      """
      vectors: [ProductVariationAssignmentVector!]

      """
      Assigned Product
      """
      product: Product
    }

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
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
      reviews(limit: Int = 10, offset: Int = 0): [ProductReview!]!
      catalogPriceRange(
        quantity: Int
        vectors: [ProductAssignmentVectorInput!]
        includeInactive: Boolean = false
      ): ProductPriceRange!
      simulatedPriceRange(
        quantity: Int
        vectors: [ProductAssignmentVectorInput!]
        includeInactive: Boolean = false
        currency: String
        useNetPrice: Boolean = false
      ): ProductPriceRange!

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
      assignments(
        includeInactive: Boolean = false
      ): [ProductVariationAssignment!]!
      meta: JSON
    }
  `,
];
