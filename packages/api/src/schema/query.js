export default [
  /* GraphQL */ `
    type Query {
      """
      Currently logged in user
      """
      me: User

      """
      Get list of users
      """
      users(
        limit: Int = 20
        offset: Int = 0
        includeGuests: Boolean = false
        queryString: String
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
        tags: [String!]
        slugs: [String!]
        includeDrafts: Boolean = false
        queryString: String
      ): Int!

      """
      Simple list of published products filtered either by tags or explicit slugs
      If a slug is provided, limit and offset don't have any effect on the result
      """
      products(
        queryString: String
        tags: [String!]
        slugs: [String!]
        limit: Int = 10
        offset: Int = 0
        includeDrafts: Boolean = false
      ): [Product!]!

      """
      Get a specific product by id or slug
      """
      product(productId: ID, slug: String): Product

      """
      List products specified prices
      """
      productCatalogPrices(productId: ID!): [ProductCatalogPrice!]!

      """
      Localization: Meta data for product
      """
      translatedProductTexts(productId: ID!): [ProductTexts!]!

      """
      Localization: Media title/subtitle of a media that is attached to a product
      """
      translatedProductMediaTexts(productMediaId: ID!): [ProductMediaTexts!]!

      """
      Localization: Variations and Variation Options
      """
      translatedProductVariationTexts(
        productVariationId: ID!
        productVariationOptionValue: String
      ): [ProductVariationTexts!]!

      """
      Returns total number languages
      """
      languagesCount(includeInactive: Boolean = false, queryString: String): Int!

      """
      Get all languages
      """
      languages(
        limit: Int = 50
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
      ): [Language]!

      """
      Get a specific language
      """
      language(languageId: ID!): Language

      """
      Get all countries
      """
      countries(
        limit: Int = 50
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
      ): [Country!]!

      """
      Returns total number of countries
      """
      countriesCount(includeInactive: Boolean = false, queryString: String): Int!

      """
      Get a specific country by ID
      """
      country(countryId: ID!): Country

      """
      Returns total number of currencies
      """
      currenciesCount(includeInactive: Boolean = false, queryString: String): Int!

      """
      Get all currencies
      """
      currencies(
        limit: Int = 50
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
      ): [Currency!]!

      """
      Get a specific currency by ID
      """
      currency(currencyId: ID!): Currency

      """
      Returns total number of delivery providers, optionally filtered by type
      """
      deliveryProvidersCount(type: DeliveryProviderType): Int!

      """
      Get all delivery providers, optionally filtered by type
      """
      deliveryProviders(type: DeliveryProviderType): [DeliveryProvider!]!

      """
      Get a specific delivery provider by ID
      """
      deliveryProvider(deliveryProviderId: ID!): DeliveryProvider

      """
      Get all delivery interfaces filtered by type
      """
      deliveryInterfaces(type: DeliveryProviderType!): [DeliveryInterface!]!

      """
      Returns total number of delivery providers, optionally filtered by type
      """
      warehousingProvidersCount(type: WarehousingProviderType): Int!

      """
      Get all warehousing providers, optionally filtered by type
      """
      warehousingProviders(type: WarehousingProviderType): [WarehousingProvider!]!

      """
      Get a specific warehousing provider by ID
      """
      warehousingProvider(warehousingProviderId: ID!): WarehousingProvider

      """
      Get all warehousing interfaces filtered by type
      """
      warehousingInterfaces(type: WarehousingProviderType!): [WarehousingInterface!]!

      """
      Returns total number of payment providers, optionally filtered by type
      """
      paymentProvidersCount(type: PaymentProviderType): Int!

      """
      Get all payment providers, optionally filtered by type
      """
      paymentProviders(type: PaymentProviderType): [PaymentProvider!]!

      """
      Get a specific payment provider by ID
      """
      paymentProvider(paymentProviderId: ID!): PaymentProvider

      """
      Get all payment interfaces filtered by type
      """
      paymentInterfaces(type: PaymentProviderType!): [PaymentInterface!]!

      """
      Returns total number of orders
      """
      ordersCount(includeCarts: Boolean = false, queryString: String): Int!

      """
      Get all orders
      """
      orders(
        limit: Int = 10
        offset: Int = 0
        includeCarts: Boolean = false
        queryString: String
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
      Get all root assortments
      """
      assortments(
        queryString: String
        tags: [String!]
        slugs: [String!]
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
        includeLeaves: Boolean = false
      ): [Assortment!]!

      """
      Returns total number of assortments that match a given criteria or all if no criteria is given
      """
      assortmentsCount(
        tags: [String!]
        slugs: [String!]
        includeInactive: Boolean = false
        includeLeaves: Boolean = false
        queryString: String
      ): Int!

      """
      Get a specific assortment by ID
      """
      assortment(assortmentId: ID, slug: String): Assortment

      """
      Localization: Meta data for assortments
      """
      translatedAssortmentTexts(assortmentId: ID!): [AssortmentTexts!]!

      """
      Localization: Media title/subtitle of a media that is attached to a assortment
      """
      translatedAssortmentMediaTexts(assortmentMediaId: ID!): [AssortmentMediaTexts!]!

      """
      Localization: Filters and Filter Options
      """
      translatedFilterTexts(filterId: ID!, filterOptionValue: String): [FilterTexts!]!

      """
      Returns total number of filters
      """
      filtersCount(includeInactive: Boolean = false, queryString: String): Int!

      """
      Get all filters
      """
      filters(
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
        queryString: String
      ): [Filter!]!

      """
      Get a specific filter by ID
      """
      filter(filterId: ID): Filter

      """
      Returns total number of product reviews
      """
      productReviewsCount(queryString: String): Int!

      """
      Get all product reviews
      """
      productReviews(
        limit: Int = 10
        offset: Int = 0
        sort: [ProductReviewSortOptionInput!]
        queryString: String
      ): [ProductReview!]!

      """
      Get a specific product review by ID
      """
      productReview(productReviewId: ID!): ProductReview!

      """
      Returns total number of quotations
      """
      quotationsCount(queryString: String): Int!

      """
      Get all quotations
      """
      quotations(limit: Int = 10, offset: Int = 0, queryString: String): [Quotation!]!

      """
      Get a specific quotation by ID
      """
      quotation(quotationId: ID!): Quotation

      """
      Returns total number of enrollments
      """
      enrollmentsCount(queryString: String, status: [String!]): Int!

      """
      Get all enrollments
      """
      enrollments(
        limit: Int = 10
        offset: Int = 0
        queryString: String
        status: [String!]
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
      Get all work from the queue
      """
      workQueue(
        limit: Int = 10
        offset: Int = 0
        status: [WorkStatus!]
        selectTypes: [WorkType!]
          @deprecated(
            reason: "For naming consistency reason this field will be removed in the future, Please types field instead"
          )
        created: DateFilterInput
        queryString: String
        sort: [WorkQueueSortOptionInput!]
        types: [WorkType!]
      ): [Work!]!

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
      Get all emitted events
      """
      events(
        types: [String!]
        limit: Int = 10
        offset: Int = 0
        queryString: String
        created: DateTime
        sort: EventSortOptionInput
      ): [Event!]!

      """
      Get total count of all emitted events
      """
      eventsCount(types: [String!], queryString: String, created: DateTime): Int!
    }
  `,
];
