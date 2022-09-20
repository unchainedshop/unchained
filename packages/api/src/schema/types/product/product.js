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
      file: Media!
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
      created: DateTime
      updated: DateTime
      published: DateTime
      texts(forceLocale: String): ProductTexts
      media(limit: Int = 10, offset: Int = 0, tags: [String!]): [ProductMedia!]!
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
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
      created: DateTime
      updated: DateTime
      deleted: DateTime
      author: User!
      product: Product!
      rating: Int
      title: String
      review: String
      voteCount(type: ProductReviewVoteType): Int
      ownVotes: [ProductReviewVote!]!
    }

    type ProductReviewVote {
      _id: ID!
      timestamp: Timestamp!
      type: ProductReviewVoteType!
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
