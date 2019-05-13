export default [
  /* GraphQL */ `
    type Mutation {
      """
      Login the user with a facebook access token
      """
      loginWithFacebook(accessToken: String!): LoginMethodResponse

      """
      Login the user with a facebook access token
      """
      loginWithGoogle(
        accessToken: String!
        tokenId: String
      ): LoginMethodResponse

      """
      Login the user with a facebook access token
      """
      loginWithLinkedIn(
        code: String!
        redirectUri: String!
      ): LoginMethodResponse

      """
      Log the user in with a password.
      """
      loginWithPassword(
        username: String
        email: String
        password: HashedPasswordInput
        plainPassword: String
      ): LoginMethodResponse

      """
      Create a new user.
      """
      createUser(
        username: String
        email: String
        password: HashedPasswordInput
        plainPassword: String
        profile: UserProfileInput
      ): LoginMethodResponse

      """
      Change the current user's password. Must be logged in.
      """
      changePassword(
        oldPassword: HashedPasswordInput
        oldPlainPassword: String
        newPassword: HashedPasswordInput
        newPlainPassword: String
      ): SuccessResponse

      """
      Request a forgot password email.
      """
      forgotPassword(email: String!): SuccessResponse

      """
      Reset the password for a user using a token received in email. Logs the user in afterwards.
      """
      resetPassword(
        newPlainPassword: String
        newPassword: HashedPasswordInput
        token: String!
      ): LoginMethodResponse

      """
      Log the user out.
      """
      logout(token: String): SuccessResponse

      """
      Marks the user's email address as verified. Logs the user in afterwards.
      """
      verifyEmail(token: String!): LoginMethodResponse

      """
      Send an email with a link the user can use verify their email address.
      """
      resendVerificationEmail(email: String): SuccessResponse

      """
      Login as Guest User (creates an anonymous user and returns logged in token)
      """
      loginAsGuest: LoginMethodResponse

      """
      Creates an alternative cart. If you use this feature, you should use explicit orderId's when using the
      cart mutations. Else it will work like a stack and the checkout will use the very first cart of the user.
      """
      createCart(orderNumber: String!): Order!

      """
      Add a new item to the cart. Order gets generated with status = open (= order before checkout / cart) if necessary.
      """
      addCartProduct(
        orderId: ID
        productId: ID!
        quantity: Int = 1
        configuration: [ProductConfigurationParameterInput!]
      ): OrderItem!

      """
      Add a new discount to the cart, a new order gets generated with status = open (= order before checkout / cart) if necessary
      """
      addCartDiscount(orderId: ID, code: String!): OrderDiscount!

      """
      Add a new quotation to the cart.
      """
      addCartQuotation(
        orderId: ID
        quotationId: ID!
        quantity: Int = 1
        configuration: [ProductConfigurationParameterInput!]
      ): OrderItem!

      """
      Change billing address and order contact of an open order (cart)
      """
      updateCart(
        orderId: ID
        billingAddress: AddressInput
        contact: ContactInput
        meta: JSON
      ): Order!

      """
      Remove all items of an open order (cart) if possible
      """
      emptyCart(orderId: ID): Order

      """
      Process the checkout (automatically charge & deliver if possible), the cart will get
      transformed to an ordinary order if everything goes well.
      """
      checkoutCart(
        orderId: ID
        orderContext: JSON
        paymentContext: JSON
        deliveryContext: JSON
      ): Order!

      """
      Change the quantity of an item in an open order
      """
      updateCartItemQuantity(itemId: ID!, quantity: Int = 1): OrderItem!
        @deprecated(reason: "Please use updateCartItem instead")

      """
      Change the quantity or configuration of an item in an open order
      """
      updateCartItem(
        itemId: ID!
        quantity: Int
        configuration: [ProductConfigurationParameterInput!]
      ): OrderItem!

      """
      Remove an item from an open order
      """
      removeCartItem(itemId: ID!): OrderItem!

      """
      Remove a discount from the cart
      """
      removeCartDiscount(discountId: ID!): OrderDiscount!

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
      updateOrderDeliveryShipping(
        orderDeliveryId: ID!
        address: AddressInput
        meta: JSON
      ): OrderDeliveryShipping!

      """
      Update a Pick Up Delivery Provider's specific configuration
      """
      updateOrderDeliveryPickUp(
        orderDeliveryId: ID!
        address: AddressInput
        meta: JSON
      ): OrderDeliveryPickUp!

      """
      Update a Card Payment Provider's specific configuration
      """
      updateOrderPaymentCard(orderPaymentId: ID!): OrderPaymentCard!

      """
      Update a PostFinance Payment Provider's specific configuration
      """
      updateOrderPaymentPostfinance(
        orderPaymentId: ID!
      ): OrderPaymentPostfinance!

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
      Remove an order while it's still open
      """
      removeOrder(orderId: ID!): Order!

      """
      Manually confirm an order which is in progress
      """
      confirmOrder(
        orderId: ID!
        orderContext: JSON
        paymentContext: JSON
        deliveryContext: JSON
      ): Order!

      """
      Manually mark an unpaid/partially paid order as fully paid
      """
      payOrder(orderId: ID!): Order!

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
      enrollUser(
        profile: UserProfileInput!
        email: String!
        password: String
      ): User

      """
      Set a new password for a specific user
      """
      setPassword(newPassword: String!, userId: ID!): User

      """
      Set roles of a user
      """
      setRoles(roles: [String!]!, userId: ID!): User

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
      updateProduct(productId: ID!, product: UpdateProductInput!): Product

      """
      Modify commerce part of a product
      """
      updateProductCommerce(
        productId: ID!
        commerce: UpdateProductCommerceInput!
      ): Product

      """
      Modify delivery part of a product
      """
      updateProductSupply(
        productId: ID!
        supply: UpdateProductSupplyInput!
      ): Product

      """
      Modify warehousing part of a product
      """
      updateProductWarehousing(
        productId: ID!
        warehousing: UpdateProductWarehousingInput!
      ): Product

      """
      Modify localized texts part of a product
      """
      updateProductTexts(
        productId: ID!
        texts: [UpdateProductTextInput!]!
      ): [ProductTexts!]!

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
      reorderProductMedia(
        sortKeys: [ReorderProductMediaInput!]!
      ): [ProductMedia!]!

      """
      Modify localized texts part of a product's media asset
      """
      updateProductMediaTexts(
        productMediaId: ID!
        texts: [UpdateProductMediaTextInput!]!
      ): [ProductMediaTexts!]!

      removeProductVariation(productVariationId: ID!): ProductVariation!
      removeProductVariationOption(
        productVariationId: ID!
        productVariationOptionValue: String!
      ): ProductVariation!
      updateProductVariationTexts(
        productVariationId: ID!
        productVariationOptionValue: String
        texts: [UpdateProductVariationTextInput!]!
      ): [ProductVariationTexts!]!
      createProductVariation(
        productId: ID!
        variation: CreateProductVariationInput!
      ): ProductVariation!
      createProductBundleItem(
        productId: ID!
        item: CreateProductBundleItemInput!
      ): Product!
      removeBundleItem(productId: ID!, index: Int!): Product!
      createProductVariationOption(
        productVariationId: ID!
        option: CreateProductVariationOptionInput!
      ): ProductVariation!

      """
      Link a new product to a ConfigurableProduct by providing a configuration
      combination that uniquely identifies a row in the assignment matrix
      """
      addProductAssignment(
        proxyId: ID!
        productId: ID!
        vectors: [ProductAssignmentVectorInput!]!
      ): Product!

      """
      Unlinks a product from a ConfigurableProduct by providing a configuration
      combination that uniquely identifies a row in the assignment matrix
      """
      removeProductAssignment(
        proxyId: ID!
        vectors: [ProductAssignmentVectorInput!]!
      ): Product!

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

      createPaymentProvider(
        paymentProvider: CreateProviderInput!
      ): PaymentProvider!
      updatePaymentProvider(
        paymentProvider: UpdateProviderInput!
        paymentProviderId: ID!
      ): PaymentProvider!
      removePaymentProvider(paymentProviderId: ID!): PaymentProvider!

      createDeliveryProvider(
        deliveryProvider: CreateProviderInput!
      ): DeliveryProvider!
      updateDeliveryProvider(
        deliveryProvider: UpdateProviderInput!
        deliveryProviderId: ID!
      ): DeliveryProvider!
      removeDeliveryProvider(deliveryProviderId: ID!): DeliveryProvider!

      createWarehousingProvider(
        warehousingProvider: CreateProviderInput!
      ): WarehousingProvider!
      updateWarehousingProvider(
        warehousingProvider: UpdateProviderInput!
        warehousingProviderId: ID!
      ): WarehousingProvider!
      removeWarehousingProvider(
        warehousingProviderId: ID!
      ): WarehousingProvider!

      createAssortment(assortment: CreateAssortmentInput!): Assortment!
      updateAssortment(
        assortment: UpdateAssortmentInput!
        assortmentId: ID!
      ): Assortment!
      setBaseAssortment(assortmentId: ID!): Assortment!
      removeAssortment(assortmentId: ID!): Assortment!

      """
      Modify localized texts part of an assortment
      """
      updateAssortmentTexts(
        assortmentId: ID!
        texts: [UpdateAssortmentTextInput!]!
      ): [AssortmentTexts!]!

      """
      Add a new product to an assortment
      """
      addAssortmentProduct(
        assortmentId: ID!
        productId: ID!
      ): AssortmentProduct!

      """
      Remove a product from an assortment
      """
      removeAssortmentProduct(assortmentProductId: ID!): AssortmentProduct!

      """
      Reorder the products in an assortment
      """
      reorderAssortmentProducts(
        sortKeys: [ReorderAssortmentProductInput!]!
      ): [AssortmentProduct!]!

      """
      Add a new child assortment to an assortment
      """
      addAssortmentLink(
        parentAssortmentId: ID!
        childAssortmentId: ID!
      ): AssortmentLink!

      """
      Remove a child/parent assortment link from it's parent
      """
      removeAssortmentLink(assortmentLinkId: ID!): AssortmentLink!

      """
      Reorder the child assortment links in it's parent
      """
      reorderAssortmentLinks(
        sortKeys: [ReorderAssortmentLinkInput!]!
      ): [AssortmentLink!]!

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
      reorderAssortmentFilters(
        sortKeys: [ReorderAssortmentFilterInput!]!
      ): [AssortmentFilter!]!

      createFilter(filter: CreateFilterInput!): Filter!
      updateFilter(filter: UpdateFilterInput!, filterId: ID!): Filter!
      removeFilter(filterId: ID!): Filter!
      removeFilterOption(filterId: ID!, filterOptionValue: String!): Filter!
      updateFilterTexts(
        filterId: ID!
        filterOptionValue: String
        texts: [UpdateFilterTextInput!]!
      ): [FilterTexts!]!
      createFilterOption(
        filterId: ID!
        option: CreateFilterOptionInput!
      ): Filter!

      """
      Add a new ProductReview
      """
      createProductReview(
        productId: ID!
        productReview: ProductReviewInput!
      ): ProductReview!

      """
      Update an existing ProductReview. The logic to allow/dissallow editing is controlled by product plugin logic
      """
      updateProductReview(
        productReviewId: ID!
        productReview: ProductReviewInput!
      ): ProductReview!

      """
      Remove an existing ProductReview. The logic to allow/dissallow removal is controlled by product plugin logic
      """
      removeProductReview(productReviewId: ID!): ProductReview!

      """
      Add a vote to a ProductReview
      """
      addProductReviewVote(
        productReviewId: ID!
        type: ProductReviewVoteType!
        meta: JSON
      ): ProductReviewVote!

      """
      Request for Proposal (RFP)
      """
      requestQuotation(
        productId: ID!
        configuration: [ProductConfigurationParameterInput!]
      ): Quotation!

      """
      Verify quotation request elligibility
      """
      verifyQuotation(quotationId: ID!, quotationContext: JSON): Quotation!

      """
      Reject an RFP, this is possible as long as a quotation is not fullfilled
      """
      rejectQuotation(quotationId: ID!, quotationContext: JSON): Quotation!

      """
      Make a proposal as answer to the RFP
      """
      makeQuotationProposal(
        quotationId: ID!
        quotationContext: JSON
      ): Quotation!
    }
  `
];
