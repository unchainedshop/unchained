export default [/* GraphQL */`
  """
  A hashed password
  """
  input HashedPassword {
    """
    The hashed password
    """
    digest: String!

    """
    Algorithm used to hash the password
    """
    algorithm: String!
  }

  input UserProfileInput {
    displayName: String
    birthday: Date
    phoneMobile: String
    gender: String
    address: AddressInput
    customFields: JSON
  }

  input AddressInput {
    firstName: String
    lastName: String
    company: String
    addressLine: String
    addressLine2: String
    postalCode: String
    regionCode: String
    city: String
    countryCode: String
  }

  input ContactInput {
    emailAddress: String
    telNumber: String
  }

  input CreateLanguageInput {
    isoCode: String!
  }
  input UpdateLanguageInput {
    isoCode: String!
    isActive: Boolean
  }

  input CreateCountryInput {
    isoCode: String!
  }
  input UpdateCountryInput {
    isoCode: String!
    isActive: Boolean
    defaultCurrencyId: String
  }

  input CreateCurrencyInput {
    isoCode: String!
  }
  input UpdateCurrencyInput {
    isoCode: String!
    isActive: Boolean
  }

  input CreateProductInput {
    title: String!
    type: String!
  }

  input CreateProductVariationInput {
    key: String!
    type: ProductVariationType!
    title: String!
  }

  input CreateProductVariationOptionInput {
    value: String!
    title: String!
  }

  input UpdateProductInput {
    tags: [String!]
  }

  input UpdateProductTextInput {
    locale: String!
    slug: String
    title: String
    subtitle: String
    description: String
    vendor: String
    labels: [String!]
  }

  input UpdateProductMediaTextInput {
    locale: String!
    title: String
    subtitle: String
  }

  input UpdateProductVariationTextInput {
    locale: String!
    title: String
    subtitle: String
  }

  input UpdateProductCommercePricingInput {
    amount: Int!
    maxQuantity: Int
    isTaxable: Boolean
    isNetPrice: Boolean
    currencyCode: String!
    countryCode: String!
  }

  input UpdateProductCommerceInput {
    pricing: [UpdateProductCommercePricingInput!]!
  }

  input UpdateProductSupplyInput {
    weightInGram: Int
    heightInMillimeters: Int
    lengthInMillimeters: Int
    widthInMillimeters: Int
  }

  input UpdateProductWarehousingInput {
    sku: String
    baseUnit: String
  }

  input ReorderProductMediaInput {
    productMediaId: ID!
    sortKey: Int!
  }

  input CreateProviderInput {
    type: String!
    adapterKey: String!
  }

  input UpdateProviderInput {
    configuration: [JSON!]
  }

  input CreateAssortmentInput {
    title: String!
    isRoot: Boolean
  }

  input UpdateAssortmentInput {
    isActive: Boolean
    isRoot: Boolean
    tags: [String!]
  }

  input UpdateAssortmentTextInput {
    locale: String!
    slug: String
    title: String
    subtitle: String
    description: String
  }

  input ReorderAssortmentProductInput {
    assortmentProductId: ID!
    sortKey: Int!
  }

  input ReorderAssortmentFilterInput {
    assortmentFilterId: ID!
    sortKey: Int!
  }

  input ReorderAssortmentLinkInput {
    assortmentLinkId: ID!
    sortKey: Int!
  }

  input CreateFilterInput {
    key: String!
    type: FilterType!
    title: String!
    options: [String!]
  }

  input CreateFilterOptionInput {
    value: String!
    title: String!
  }

  input UpdateFilterInput {
    isActive: Boolean
    key: String
  }

  input UpdateFilterTextInput {
    locale: String!
    title: String
    subtitle: String
  }

  input ProductConfigurationParameter {
    key: String!
    value: String!
  }

  input ProductReviewInput {
    rating: Int
    title: String
    review: String
    meta: JSON
  }

  type Mutation {
    """
    Login the user with a facebook access token
    """
    loginWithFacebook (accessToken: String!): LoginMethodResponse

    """
    Login the user with a facebook access token
    """
    loginWithGoogle (accessToken: String!, tokenId: String): LoginMethodResponse

    """
    Login the user with a facebook access token
    """
    loginWithLinkedIn (code: String!, redirectUri: String!): LoginMethodResponse

    """
    Log the user in with a password. ACL: Everybody
    """
    loginWithPassword (username: String, email: String, password: HashedPassword, plainPassword: String): LoginMethodResponse

    """
    Create a new user. ACL: Everybody
    """
    createUser (username: String, email: String, password: HashedPassword, plainPassword: String, profile: UserProfileInput): LoginMethodResponse

    """
    Change the current user's password. Must be logged in. ACL: Everybody
    """
    changePassword (oldPassword: HashedPassword, oldPlainPassword: String, newPassword: HashedPassword, newPlainPassword: String): SuccessResponse

    """
    Request a forgot password email. ACL: Everybody
    """
    forgotPassword (email: String!): SuccessResponse

    """
    Reset the password for a user using a token received in email. Logs the user in afterwards. ACL: Everybody
    """
    resetPassword (newPlainPassword: String, newPassword: HashedPassword, token: String!): LoginMethodResponse

    """
    Log the user out.
    """
    logout (token: String!): SuccessResponse

    """
    Marks the user's email address as verified. Logs the user in afterwards.
    """
    verifyEmail (token: String!): LoginMethodResponse

    """
    Send an email with a link the user can use verify their email address.
    """
    resendVerificationEmail (email: String): SuccessResponse

    """
    Login as Guest User (creates an anonymous user and returns logged in token) ACL: Everybody
    """
    loginAsGuest: LoginMethodResponse

    """
    Add a new item to the cart. Order gets generated with status = open (= order before checkout / cart) if necessary. ACL: Logged in users (including guests)
    """
    addCartProduct(productId: ID!, quantity: Int = 1, configuration: [ProductConfigurationParameter!]): OrderItem!

    """
    Change the quantity of an item in the cart ACL: Logged in users (including guests)
    """
    updateCartItemQuantity(itemId: ID!, quantity: Int = 1): OrderItem!

    """
    Remove an item from the cart ACL: Logged in users (including guests)
    """
    removeCartItem(itemId: ID!): OrderItem!

    """
    Add a new discount to the cart, a new order gets generated with status = open (= order before checkout / cart) if necessary ACL: Logged in users (including guests)
    """
    addCartDiscount(code: String!): OrderDiscount!

    """
    Remove a discount from the cart ACL: Logged in users (including guests)
    """
    removeCartDiscount(discountId: ID!): OrderDiscount!

    """
    Remove an order while it's still a cart
    """
    removeOrder(orderId: ID!): Order!

    """
    Change billing address and order conact of an open order
    """
    updateOrder(orderId: ID!, address: AddressInput, contact: ContactInput, meta: JSON): Order!

    """
    Change the delivery method/provider
    """
    setOrderDeliveryProvider(orderId: ID!, deliveryProviderId: ID!): Order!

    """
    Change the payment method/provider
    """
    setOrderPaymentProvider(orderId: ID!, paymentProviderId: ID!): Order!

    """
    Update a Shipping Delivery Provider's specific configuration
    """
    updateOrderDeliveryShipping(orderDeliveryId: ID!, address: AddressInput, meta: JSON): OrderDeliveryShipping!

    """
    Update a Pick Up Delivery Provider's specific configuration
    """
    updateOrderDeliveryPickUp(orderDeliveryId: ID!, address: AddressInput, meta: JSON): OrderDeliveryPickUp!

    """
    Update a Card Payment Provider's specific configuration
    """
    updateOrderPaymentCard(orderPaymentId: ID!): OrderPaymentCard!

    """
    Update a PostFinance Payment Provider's specific configuration
    """
    updateOrderPaymentPostfinance(orderPaymentId: ID!): OrderPaymentPostfinance!

    """
    Update am Invoice Payment Provider's specific configuration
    """
    updateOrderPaymentInvoice(orderPaymentId: ID!): OrderPaymentInvoice!

    """
    Update a PayPal Payment Provider's specific configuration
    """
    updateOrderPaymentPaypal(orderPaymentId: ID!): OrderPaymentPaypal!

    """
    Update a Crypo Provider's specific configuration
    """
    updateOrderPaymentCrypto(orderPaymentId: ID!): OrderPaymentCrypto!

    """
    Process the checkout (automatically charge & deliver if possible), the cart will get
    transformed to an ordinary order if everything goes well.
    """
    checkout(orderContext: JSON, paymentContext: JSON, deliveryContext: JSON): Order!

    """
    This method takes a cart by id and
    transfers it to the currently logged in user
    if the current user already has an open order (cart), remove that one
    this method is needed to transition from a guest user to a logged in user
    where the cart has to persist items
    """
    captureOrder(orderId: ID!): Order

    """
    Update Avatar of any user or logged in user if userId is not provided
    """
    updateUserAvatar(avatar: Upload!, userId: ID): User

    """
    Update E-Mail address of any user or logged in user if userId is not provided
    """
    updateEmail(email: String!, userId: ID): User

    """
    Update tags of user
    """
    updateUserTags(tags: [String]!, userId: ID!): User

    """
    Update Profile of any user or logged in user if userId is not provided
    """
    updateUserProfile(profile: UserProfileInput!, userId: ID): User


    """
    Enroll a new user, setting enroll to true will let the user choose his password (e-mail gets sent)
    """
    enrollUser(profile: UserProfileInput!, email: String!, password: String): User

    """
    Set a new password for a specific user
    """
    setPassword(newPassword: String!, userId: ID!): User

    """
    Set roles of a user
    """
    setRoles(roles: [String!]!, userId: ID!): User

    """
    Manually confirm an order which is in progress
    """
    confirmOrder(orderId: ID!): Order!

    """
    Manually mark an unpaid/partially paid order as fully paid
    """
    payOrder(orderId: ID!): Order!

    """
    Create a new product
    """
    createProduct(product: CreateProductInput!): Product!

    """
    Make the product visible on any shop listings (product queries)
    """
    publishProduct(productId: ID!): Product!

    """
    Hide the product visible from any shop listings (product queries)
    """
    unpublishProduct(productId: ID!): Product!

    """
    Remove the product completely!
    """
    removeProduct(productId: ID!): Product!

    """
    Modify generic infos of a product (tags for ex.)
    """
    updateProduct(productId: ID!, product: UpdateProductInput!) : Product

    """
    Modify commerce part of a product
    """
    updateProductCommerce(productId: ID!, commerce: UpdateProductCommerceInput!) : Product

    """
    Modify delivery part of a product
    """
    updateProductSupply(productId: ID!, supply: UpdateProductSupplyInput!) : Product

    """
    Modify warehousing part of a product
    """
    updateProductWarehousing(productId: ID!, warehousing: UpdateProductWarehousingInput!) : Product

    """
    Modify localized texts part of a product
    """
    updateProductTexts(productId: ID!, texts: [UpdateProductTextInput!]!) : [ProductTexts!]!

    """
    Add a new media to a product's visualization
    """
    addProductMedia(productId: ID!, media: Upload!): ProductMedia!

    """
    Remove a media asset from a product's visualization
    """
    removeProductMedia(productMediaId: ID!): ProductMedia!

    """
    Reorder a media asset (first is primary)
    """
    reorderProductMedia(sortKeys: [ReorderProductMediaInput!]!): [ProductMedia!]!

    """
    Modify localized texts part of a product's media asset
    """
    updateProductMediaTexts(productMediaId: ID!, texts: [UpdateProductMediaTextInput!]!) : [ProductMediaTexts!]!

    removeProductVariation(productVariationId: ID!): ProductVariation!
    removeProductVariationOption(productVariationId: ID!, productVariationOptionValue: String!): ProductVariation!
    updateProductVariationTexts(productVariationId: ID!, productVariationOptionValue: String, texts: [UpdateProductVariationTextInput!]!): [ProductVariationTexts!]!
    createProductVariation(productId: ID!, variation: CreateProductVariationInput!): ProductVariation!
    createProductVariationOption(productVariationId: ID!, option: CreateProductVariationOptionInput!): ProductVariation!

    addProductAssignment(proxyId: ID!, productId: ID!, vectors: [ProductAssignmentVectorInput!]!): Product!
    removeProductAssignment(proxyId: ID!, vectors: [ProductAssignmentVectorInput!]!): Product!

    createLanguage(language: CreateLanguageInput!): Language!
    updateLanguage(language: UpdateLanguageInput!, languageId: ID!): Language!
    setBaseLanguage(languageId: ID!): Language!
    removeLanguage(languageId: ID!): Language!

    createCountry(country: CreateCountryInput!): Country!
    updateCountry(country: UpdateCountryInput!, countryId: ID!): Country!
    setBaseCountry(countryId: ID!): Country!
    removeCountry(countryId: ID!): Country!

    createCurrency(currency: CreateCurrencyInput!): Currency!
    updateCurrency(currency: UpdateCurrencyInput!, currencyId: ID!): Currency!
    removeCurrency(currencyId: ID!): Currency!

    createPaymentProvider(paymentProvider: CreateProviderInput!): PaymentProvider!
    updatePaymentProvider(paymentProvider: UpdateProviderInput!, paymentProviderId: ID!): PaymentProvider!
    removePaymentProvider(paymentProviderId: ID!): PaymentProvider!

    createDeliveryProvider(deliveryProvider: CreateProviderInput!): DeliveryProvider!
    updateDeliveryProvider(deliveryProvider: UpdateProviderInput!, deliveryProviderId: ID!): DeliveryProvider!
    removeDeliveryProvider(deliveryProviderId: ID!): DeliveryProvider!

    createWarehousingProvider(warehousingProvider: CreateProviderInput!): WarehousingProvider!
    updateWarehousingProvider(warehousingProvider: UpdateProviderInput!, warehousingProviderId: ID!): WarehousingProvider!
    removeWarehousingProvider(warehousingProviderId: ID!): WarehousingProvider!

    createAssortment(assortment: CreateAssortmentInput!): Assortment!
    updateAssortment(assortment: UpdateAssortmentInput!, assortmentId: ID!): Assortment!
    setBaseAssortment(assortmentId: ID!): Assortment!
    removeAssortment(assortmentId: ID!): Assortment!

    """
    Modify localized texts part of an assortment
    """
    updateAssortmentTexts(assortmentId: ID!, texts: [UpdateAssortmentTextInput!]!) : [AssortmentTexts!]!

    """
    Add a new product to an assortment
    """
    addAssortmentProduct(assortmentId: ID!, productId: ID!): AssortmentProduct!

    """
    Remove a product from an assortment
    """
    removeAssortmentProduct(assortmentProductId: ID!): AssortmentProduct!

    """
    Reorder the products in an assortment
    """
    reorderAssortmentProducts(sortKeys: [ReorderAssortmentProductInput!]!): [AssortmentProduct!]!

    """
    Add a new child assortment to an assortment
    """
    addAssortmentLink(parentAssortmentId: ID!, childAssortmentId: ID!): AssortmentLink!

    """
    Remove a child/parent assortment link from it's parent
    """
    removeAssortmentLink(assortmentLinkId: ID!): AssortmentLink!

    """
    Reorder the child assortment links in it's parent
    """
    reorderAssortmentLinks(sortKeys: [ReorderAssortmentLinkInput!]!): [AssortmentLink!]!

    """
    Add a new filter to an assortment
    """
    addAssortmentFilter(assortmentId: ID!, filterId: ID!): AssortmentFilter!

    """
    Remove a product from an assortment
    """
    removeAssortmentFilter(assortmentFilterId: ID!): AssortmentFilter!

    """
    Reorder the products in an assortment
    """
    reorderAssortmentFilters(sortKeys: [ReorderAssortmentFilterInput!]!): [AssortmentFilter!]!

    createFilter(filter: CreateFilterInput!): Filter!
    updateFilter(filter: UpdateFilterInput!, filterId: ID!): Filter!
    removeFilter(filterId: ID!): Filter!
    removeFilterOption(filterId: ID!, filterOptionValue: String!): Filter!
    updateFilterTexts(filterId: ID!, filterOptionValue: String, texts: [UpdateFilterTextInput!]!): [FilterTexts!]!
    createFilterOption(filterId: ID!, option: CreateFilterOptionInput!): Filter!

    """
    Add a new ProductReview
    """
    createProductReview(productId: ID!, productReview: ProductReviewInput!): ProductReview!

    """
    Update an existing ProductReview. The logic to allow/dissallow editing is controlled by product plugin logic
    """
    updateProductReview(productReviewId: ID!, productReview: ProductReviewInput!): ProductReview!

    """
    Remove an existing ProductReview. The logic to allow/dissallow removal is controlled by product plugin logic
    """
    removeProductReview(productReviewId: ID!): ProductReview!
  }
`];
