export default [
  /* GraphQL */ `
    enum ProductStatus {
      """
      Unpublished (hidden from catalog)
      """
      DRAFT

      """
      Published
      """
      ACTIVE

      """
      Deleted
      """
      DELETED
    }

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

    type ProductPrice {
      _id: ID!
      isTaxable: Boolean!
      isNetPrice: Boolean!
      country: Country!
      price: Money!
      maxQuantity: Int
    }

    type ProductDiscount {
      _id: ID!
      interface: DiscountInterface
      total: Money!
    }

    type ProductMediaTexts {
      _id: ID!
      locale: String
      title: String
      subtitle: String
    }

    type ProductMedia {
      _id: ID!
      tags: [String!]
      file: Media!
      sortKey: Int!
      texts(forceLocale: String): ProductMediaTexts
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

    type ProductTexts {
      _id: ID!
      locale: String
      slug: String
      title: String
      subtitle: String
      description: String
      vendor: String
      brand: String
      labels: [String!]
    }

    """
    Abstract Product
    """
    interface Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: Date
      updated: Date
      published: Date
      texts: ProductTexts
      media(limit: Int = 10, offset: Int = 0): [ProductMedia!]!
      reviews: [ProductReview!]!
      meta: JSON
      assortmentPaths(forceLocale: String): [ProductAssortmentPath!]!
    }

    """
    Directed assortment to product paths (breadcrumbs)
    """
    type ProductAssortmentPath {
      assortmentProduct: AssortmentProduct!
      links: [AssortmentPathLink!]!
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

    type ProductReview {
      _id: ID!
      created: Date
      updated: Date
      deleted: Date
      author: User!
      product: Product!
      rating: Int
      title: String
      review: String
      meta: JSON
      voteCount(type: ProductReviewVoteType): Int
      ownVotes: [ProductReviewVote!]!
    }

    type ProductReviewVote {
      _id: ID!
      timestamp: Date!
      type: ProductReviewVoteType!
      meta: JSON
    }

    enum ProductReviewVoteType {
      UPVOTE
      DOWNVOTE
      REPORT
    }

    type ProductConfigurationParameter {
      key: String!
      value: String!
    }
  `
];
