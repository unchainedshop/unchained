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

    type ProductVariationTexts @cacheControl(maxAge: 180) {
      _id: ID!
      locale: Locale
      title: String
      subtitle: String
    }

    type ProductVariationOption @cacheControl(maxAge: 180) {
      _id: ID!
      texts(forceLocale: String): ProductVariationTexts
      value: String
    }

    type ProductVariation @cacheControl(maxAge: 180) {
      _id: ID!
      texts(forceLocale: String): ProductVariationTexts
      type: ProductVariationType
      key: String
      options: [ProductVariationOption!]
    }

    """
    Key Value Combination
    """
    type ProductVariationAssignmentVector @cacheControl(maxAge: 180) {
      _id: ID!
      variation: ProductVariation
      option: ProductVariationOption
    }

    """
    Key Value Combination to Product Assignment
    """
    type ProductVariationAssignment @cacheControl(maxAge: 180) {
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
    type ConfigurableProduct implements Product @cacheControl(maxAge: 180) {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [LowerCaseString!]
      created: DateTime
      updated: DateTime
      published: DateTime
      media(limit: Int = 10, offset: Int = 0, tags: [LowerCaseString!]): [ProductMedia!]!
      texts(forceLocale: String): ProductTexts
      assortmentPaths: [ProductAssortmentPath!]!
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
      catalogPriceRange(
        quantity: Int = 0
        vectors: [ProductAssignmentVectorInput!]
        includeInactive: Boolean = false
        currency: String
      ): PriceRange
      simulatedPriceRange(
        quantity: Int
        vectors: [ProductAssignmentVectorInput!]
        includeInactive: Boolean = false
        currency: String
        useNetPrice: Boolean = false
      ): PriceRange @cacheControl(scope: PRIVATE)

      """
      Reduced list of possible products by key/value combinations
      """
      products(vectors: [ProductAssignmentVectorInput!], includeInactive: Boolean = false): [Product!]

      """
      Product's variations (keys) and their options (values)
      """
      variations: [ProductVariation!]

      """
      Complete assignment matrix
      """
      assignments(includeInactive: Boolean = false): [ProductVariationAssignment!]!
    }
  `,
];
