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

    type ProductDiscount {
      _id: ID!
      interface: DiscountInterface
      total: Price!
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
      file: Media
      sortKey: Int!
      texts(forceLocale: String): ProductMediaTexts
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
      media(limit: Int = 10, offset: Int = 0, tags: [String!]): [ProductMedia!]!
      reviews: [ProductReview!]!
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
      assortmentPaths: [ProductAssortmentPath!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
    }

    """
    Directed assortment to product paths (breadcrumbs)
    """
    type ProductAssortmentPath {
      assortmentProduct: AssortmentProduct!
      links: [AssortmentPathLink!]!
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
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
      voteCount(type: ProductReviewVoteType): Int
      ownVotes: [ProductReviewVote!]!
    }

    type ProductReviewVote {
      _id: ID!
      timestamp: Date!
      type: ProductReviewVoteType!
      meta: JSON
        @deprecated(
          reason: "Due to ambiguity this field will be removed on future releases,Please write a custom resolver that reflects your business-logic"
        )
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

    type PriceLevel {
      minQuantity: Int!
      maxQuantity: Int
      price: Price!
    }

    type ProductCatalogPrice {
      _id: ID!
      isTaxable: Boolean!
      isNetPrice: Boolean!
      country: Country!
      currency: Currency!
      amount: Int!
      maxQuantity: Int
    }
  `,
];
