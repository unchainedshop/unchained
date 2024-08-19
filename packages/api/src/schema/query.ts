export default [
  /* GraphQL */ `
    type Query {
      """
      Currently logged in user
      """
      me: User

      """
      Get list of users, by default sorted by creation date (ascending) unless a queryString is set
      """
      users(
        limit: Int = 20
        offset: Int = 0
        includeGuests: Boolean = false
        queryString: String
        sort: [SortOptionInput!]
      ): [User!]!

      """
      Get total number of users in the system that match query
      """
      usersCount(includeGuests: Boolean = false, queryString: String): Int!

      """
      Specific user data if userId provided, else returns currently logged in
      """
      user(userId: ID): User

      """
      Return total number of published products filtered either by tags or explicit slugs
      If a slug is provided
      """
      productsCount(
        tags: [LowerCaseString!]
        slugs: [String!]
        includeDrafts: Boolean = false
        queryString: String
      ): Int! @cacheControl(maxAge: 180)

      """
      Simple list of published products filtered either by tags or explicit slugs
      If a slug is provided, limit and offset don't have any effect on the result
      By default sorted by sequence (ascending) and published (ascending) unless a queryString is set
      """
      products(
        queryString: String
        tags: [LowerCaseString!]
        slugs: [String!]
        limit: Int = 10
        offset: Int = 0
        includeDrafts: Boolean = false
        sort: [SortOptionInput!]
      ): [Product!]!

      """
      Get a specific product by id or slug
      """
      product(productId: ID, slug: String): Product

      """
      List products specified prices
      """
      productCatalogPrices(productId: ID!): [ProductCatalogPrice!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Localization: Meta data for product
      """
      translatedProductTexts(productId: ID!): [ProductTexts!]! @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Localization: Media title/subtitle of a media that is attached to a product
      """
      translatedProductMediaTexts(productMediaId: ID!): [ProductMediaTexts!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Localization: Variations and Variation Options
      """
      translatedProductVariationTexts(
        productVariationId: ID!
        productVariationOptionValue: String
      ): [ProductVariationTexts!]! @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Returns total number languages
      """
      languagesCount(includeInactive: Boolean = false, queryString: String): Int!
        @cacheControl(maxAge: 180)

      """
      Get all languages, by default sorted by creation date (ascending)
      """
      languages(
        limit: Int = 50
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
        sort: [SortOptionInput!]
      ): [Language]!

      """
      Get a specific language
      """
      language(languageId: ID!): Language

      """
      Get all countries, by default sorted by creation date (ascending)
      """
      countries(
        limit: Int = 50
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
        sort: [SortOptionInput!]
      ): [Country!]!

      """
      Returns total number of countries
      """
      countriesCount(includeInactive: Boolean = false, queryString: String): Int!
        @cacheControl(maxAge: 180)

      """
      Get a specific country by ID
      """
      country(countryId: ID!): Country

      """
      Returns total number of currencies
      """
      currenciesCount(includeInactive: Boolean = false, queryString: String): Int!
        @cacheControl(maxAge: 180)

      """
      Get all currencies, by default sorted by creation date (ascending)
      """
      currencies(
        limit: Int = 50
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
        sort: [SortOptionInput!]
      ): [Currency!]!

      """
      Get a specific currency by ID
      """
      currency(currencyId: ID!): Currency

      """
      Returns total number of delivery providers, optionally filtered by type
      """
      deliveryProvidersCount(type: DeliveryProviderType): Int! @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get all delivery providers, optionally filtered by type
      """
      deliveryProviders(type: DeliveryProviderType): [DeliveryProvider!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get a specific delivery provider by ID
      """
      deliveryProvider(deliveryProviderId: ID!): DeliveryProvider
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get all delivery interfaces filtered by type
      """
      deliveryInterfaces(type: DeliveryProviderType!): [DeliveryInterface!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Returns total number of delivery providers, optionally filtered by type
      """
      warehousingProvidersCount(type: WarehousingProviderType): Int!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get all warehousing providers, optionally filtered by type
      """
      warehousingProviders(type: WarehousingProviderType): [WarehousingProvider!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get a specific warehousing provider by ID
      """
      warehousingProvider(warehousingProviderId: ID!): WarehousingProvider
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get all warehousing interfaces filtered by type
      """
      warehousingInterfaces(type: WarehousingProviderType!): [WarehousingInterface!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get token
      """
      token(tokenId: ID!): Token

      """
      Get all tokens
      """
      tokens(limit: Int = 10, offset: Int = 0): [Token!]!

      """
      Returns total number of payment providers, optionally filtered by type
      """
      paymentProvidersCount(type: PaymentProviderType): Int! @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get all payment providers, optionally filtered by type
      """
      paymentProviders(type: PaymentProviderType): [PaymentProvider!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get a specific payment provider by ID
      """
      paymentProvider(paymentProviderId: ID!): PaymentProvider @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get all payment interfaces filtered by type
      """
      paymentInterfaces(type: PaymentProviderType!): [PaymentInterface!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Returns total number of orders
      """
      ordersCount(includeCarts: Boolean = false, queryString: String): Int!

      """
      Get all orders, by default sorted by creation date (descending)
      """
      orders(
        limit: Int = 10
        offset: Int = 0
        includeCarts: Boolean = false
        queryString: String
        sort: [SortOptionInput!]
      ): [Order!]!

      """
      Get a specific single order
      """
      order(orderId: ID!): Order

      """
      Get shop-global data and the resolved country/language pair
      """
      shopInfo: Shop!

      """
      Get all root assortments, by default sorted by sequence (ascending)
      """
      assortments(
        queryString: String
        tags: [LowerCaseString!]
        slugs: [String!]
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
        includeLeaves: Boolean = false
        sort: [SortOptionInput!]
      ): [Assortment!]!

      """
      Returns total number of assortments that match a given criteria or all if no criteria is given
      """
      assortmentsCount(
        tags: [LowerCaseString!]
        slugs: [String!]
        includeInactive: Boolean = false
        includeLeaves: Boolean = false
        queryString: String
      ): Int! @cacheControl(maxAge: 180)

      """
      Get a specific assortment by ID
      """
      assortment(assortmentId: ID, slug: String): Assortment

      """
      Localization: Meta data for assortments
      """
      translatedAssortmentTexts(assortmentId: ID!): [AssortmentTexts!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Localization: Media title/subtitle of a media that is attached to a assortment
      """
      translatedAssortmentMediaTexts(assortmentMediaId: ID!): [AssortmentMediaTexts!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Localization: Filters and Filter Options
      """
      translatedFilterTexts(filterId: ID!, filterOptionValue: String): [FilterTexts!]!
        @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Returns total number of filters
      """
      filtersCount(includeInactive: Boolean = false, queryString: String): Int!
        @cacheControl(maxAge: 180)

      """
      Get all filters, by default sorted by creation date (ascending)
      """
      filters(
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
        sort: [SortOptionInput!]
      ): [Filter!]!

      """
      Get a specific filter by ID
      """
      filter(filterId: ID): Filter

      """
      Returns total number of product reviews
      """
      productReviewsCount(queryString: String): Int! @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get all product reviews, by default sorted by creation date (descending)
      """
      productReviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]! @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Get a specific product review by ID
      """
      productReview(productReviewId: ID!): ProductReview! @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Returns total number of quotations
      """
      quotationsCount(queryString: String): Int!

      """
      Get all quotations, by default sorted by creation date (ascending)
      """
      quotations(
        limit: Int = 10
        offset: Int = 0
        queryString: String
        sort: [SortOptionInput!]
      ): [Quotation!]!

      """
      Get a specific quotation by ID
      """
      quotation(quotationId: ID!): Quotation

      """
      Returns total number of enrollments
      """
      enrollmentsCount(queryString: String, status: [String!]): Int!

      """
      Get all enrollments, by default sorted by creation date (ascending)
      """
      enrollments(
        limit: Int = 10
        offset: Int = 0
        queryString: String
        status: [String!]
        sort: [SortOptionInput!]
      ): [Enrollment!]!

      """
      Get a specific quotation by ID
      """
      enrollment(enrollmentId: ID!): Enrollment

      """
      Search products
      """
      searchProducts(
        queryString: String
        filterQuery: [FilterQueryInput!]
        assortmentId: ID
        orderBy: SearchOrderBy
        includeInactive: Boolean = false
        ignoreChildAssortments: Boolean = false
      ): ProductSearchResult!

      """
      Search assortments
      """
      searchAssortments(
        queryString: String
        assortmentIds: [ID!]
        orderBy: SearchOrderBy
        includeInactive: Boolean = false
      ): AssortmentSearchResult!

      """
      Get all work from the queue, by default sorted by start date (desc), priority (desc), originalWorkId (asc) and created (asc)
      """
      workQueue(
        limit: Int = 10
        offset: Int = 0
        status: [WorkStatus!]
        created: DateFilterInput
        queryString: String
        sort: [SortOptionInput!]
        types: [WorkType!]
      ): [Work!]!

      """
      Return total number of workers filtered the provided arguments
      """
      workQueueCount(
        status: [WorkStatus!]
        types: [WorkType!]
        created: DateFilterInput
        queryString: String
      ): Int!

      """
      Get a specific work unit by ID
      """
      work(workId: ID!): Work
      """
      Get List of currently registered worker plugins
      """
      activeWorkTypes: [WorkType!]!

      """
      Get a specific work unit by ID
      """
      event(eventId: ID!): Event

      """
      Get all emitted events, by default sorted by creation date (desc)
      """
      events(
        types: [String!]
        limit: Int = 10
        offset: Int = 0
        queryString: String
        created: DateTime
        sort: [SortOptionInput!]
      ): [Event!]!

      """
      Get total count of all emitted events
      """
      eventsCount(types: [String!], queryString: String, created: DateTime): Int!

      """
      Determines if a token is valid/active for reset password
      """
      validateResetPasswordToken(token: String!): Boolean!

      """
      Determines if a token is valid/active for email verification
      """
      validateVerifyEmailToken(token: String!): Boolean!

      """
      Returns aggregated report of all the events that occurred in the system
      """
      eventStatistics(types: [String!], from: Timestamp, to: Timestamp): [EventStatistics!]!
      """
      Returns aggregated report of all the orders that occurred in the system
      """
      orderStatistics(from: Timestamp, to: Timestamp): OrderStatistics!
      """
      Returns aggregated report of all the worker jobs that occurred in the system
      """
      workStatistics(types: [String!], from: Timestamp, to: Timestamp): [WorkStatistics!]!
    }
  `,
];
