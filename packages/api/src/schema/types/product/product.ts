export default [
  /* GraphQL */ `
    enum ProductType {
      SIMPLE_PRODUCT
      CONFIGURABLE_PRODUCT
      BUNDLE_PRODUCT
      PLAN_PRODUCT
      TOKENIZED_PRODUCT
    }

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

    type ProductDiscount @cacheControl(maxAge: 0) {
      _id: ID!
      interface: DiscountInterface
      total: Price!
    }

    type ProductMediaTexts @cacheControl(maxAge: 180) {
      _id: ID!
      locale: Locale!
      title: String
      subtitle: String
    }

    type ProductMedia @cacheControl(maxAge: 180) {
      _id: ID!
      tags: [LowerCaseString!]
      file: Media
      sortKey: Int!
      texts(forceLocale: Locale): ProductMediaTexts
    }

    type ProductTexts @cacheControl(maxAge: 180) {
      _id: ID!
      locale: Locale!
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
      tags: [LowerCaseString!]
      created: DateTime
      updated: DateTime
      published: DateTime
      texts(forceLocale: Locale): ProductTexts
      media(limit: Int = 10, offset: Int = 0, tags: [LowerCaseString!]): [ProductMedia!]!
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
      reviewsCount(queryString: String): Int!
      assortmentPaths: [ProductAssortmentPath!]!
      proxies: [ConfigurableOrBundleProduct!]!
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
    type ProductAssortmentPath @cacheControl(maxAge: 180) {
      assortmentProduct: AssortmentProduct!
      links: [AssortmentPathLink!]!
    }

    type ProductReview @cacheControl(maxAge: 60) {
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
      ownVotes: [ProductReviewVote!]! @cacheControl(scope: PRIVATE, maxAge: 60)
    }

    type ProductReviewVote @cacheControl(maxAge: 60) {
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

    type PriceLevel @cacheControl(maxAge: 60) {
      minQuantity: Int!
      maxQuantity: Int
      price: Price!
    }

    type ProductCatalogPrice @cacheControl(maxAge: 60) {
      isTaxable: Boolean!
      isNetPrice: Boolean!
      country: Country!
      currency: Currency!
      amount: Int!
      minQuantity: Int
    }

    union ConfigurableOrBundleProduct = BundleProduct | ConfigurableProduct
  `,
];
