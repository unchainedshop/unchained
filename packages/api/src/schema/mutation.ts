export default [
  /* GraphQL */ `
    type Mutation {
      pageView(path: String!, referrer: String): String!
      """
      Log the user in with a password.
      """
      loginWithPassword(username: String, email: String, password: String!): LoginMethodResponse

      """
      Log the user in with a WebAuthn device
      """
      loginWithWebAuthn(webAuthnPublicKeyCredentials: JSON!): LoginMethodResponse

      """
      Web3
      """
      addWeb3Address(address: String!): User!
      verifyWeb3Address(address: String!, hash: String!): User!
      removeWeb3Address(address: String!): User!

      """
      Create a new user.
      """
      createUser(
        username: String
        email: String
        webAuthnPublicKeyCredentials: JSON
        password: String
        profile: UserProfileInput
      ): LoginMethodResponse

      """
      Update hearbeat (updates user activity information such as last
      login and logged in user IP address, locale and country where they
      accessed the system)
      """
      heartbeat: User!

      """
      Change the current user's password. Must be logged in.
      """
      changePassword(oldPassword: String, newPassword: String): SuccessResponse

      """
      Request a forgot password email.
      """
      forgotPassword(email: String!): SuccessResponse

      """
      Reset the password for a user using a token received in email. Logs the user in afterwards.
      """
      resetPassword(newPassword: String, token: String!): LoginMethodResponse

      """
      Log the user out.
      """
      logout: SuccessResponse

      """
      Marks the user's email address as verified. Logs the user in afterwards.
      """
      verifyEmail(token: String!): LoginMethodResponse

      """
      Send an email with a link the user can use verify their email address.
      """
      sendVerificationEmail(email: String): SuccessResponse

      """
      Login as Guest User (creates an anonymous user and returns logged in token)
      """
      loginAsGuest: LoginMethodResponse

      """
      Create WebAuthn PublicKeyCredentialCreationOptions to use for Registering a new WebAuthn Device
      """
      createWebAuthnCredentialCreationOptions(username: String!, extensionOptions: JSON): JSON!

      """
      Register WebAuthn Credentials for current user
      """
      addWebAuthnCredentials(credentials: JSON!): User!

      """
      Remove WebAuthn Credentials for current user
      """
      removeWebAuthnCredentials(credentialsId: ID!): User!

      """
      Create WebAuthn PublicKeyCredentialRequestrOptions to use for WebAuthn Login Flow
      """
      createWebAuthnCredentialRequestOptions(username: String, extensionOptions: JSON): JSON!

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
      Add multiple new item to the cart. Order gets generated with status = open (= order before checkout / cart) if necessary.
      """
      addMultipleCartProducts(orderId: ID, items: [OrderItemInput!]!): Order!

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
      Change billing address and order contact of an open order (cart). All of the parameters
      except order ID are optional and the update will ocure for parameters provided.
      If the delivery provider or payment provider ID provided doesn’t already exist new order payment
      will be created with the provided ID.
      """
      updateCart(
        orderId: ID
        billingAddress: AddressInput
        contact: ContactInput
        meta: JSON
        paymentProviderId: ID
        deliveryProviderId: ID
      ): Order!

      """
      Remove all items of an open order (cart) if possible.
      if you want to remove single cart item use removeCartItem instead
      """
      emptyCart(orderId: ID): Order

      """
      Process the checkout (automatically charge & deliver if possible), the cart will get
      transformed to an ordinary order if everything goes well.
      """
      checkoutCart(orderId: ID, paymentContext: JSON, deliveryContext: JSON): Order!

      """
      Change the quantity or configuration of an item in an open order.align-baselineAll
      of the parameters are optional except item ID and for the parameters provided the
      update will be performed accordingly.
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
      Create a enrollment.
      """
      createEnrollment(
        plan: EnrollmentPlanInput!
        billingAddress: AddressInput
        contact: ContactInput
        payment: EnrollmentPaymentInput
        delivery: EnrollmentDeliveryInput
        meta: JSON
      ): Enrollment!

      """
      Update a enrollment
      """
      updateEnrollment(
        enrollmentId: ID
        plan: EnrollmentPlanInput
        billingAddress: AddressInput
        contact: ContactInput
        payment: EnrollmentPaymentInput
        delivery: EnrollmentDeliveryInput
        meta: JSON
      ): Enrollment!

      """
      Activate a enrollment by changing the status to ACTIVE
      """
      activateEnrollment(enrollmentId: ID!): Enrollment!

      """
      Terminate an actively running enrollment by changing it's status to TERMINATED
      """
      terminateEnrollment(enrollmentId: ID!): Enrollment!

      """
      Change the delivery method/provider to an order. If the delivery provider
      doesn’t exists new delivery provider will be created with the provided ID.
      """
      setOrderDeliveryProvider(orderId: ID!, deliveryProviderId: ID!): Order!

      """
      Change the payment method/provider to an order. If the payment provider
      doesn’t exists new payment provider will be created with the provided ID.
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
        orderPickUpLocationId: ID!
        meta: JSON
      ): OrderDeliveryPickUp!

      """
      Update a Card Payment Provider's specific configuration
      """
      updateOrderPaymentCard(orderPaymentId: ID!, meta: JSON): OrderPaymentCard!

      """
      Update an Invoice Payment Provider's specific configuration
      """
      updateOrderPaymentInvoice(orderPaymentId: ID!, meta: JSON): OrderPaymentInvoice!

      """
      Update a Generic Payment Provider's specific configuration
      """
      updateOrderPaymentGeneric(orderPaymentId: ID!, meta: JSON): OrderPaymentGeneric!

      """
      Remove an order while it's still open
      """
      removeOrder(orderId: ID!): Order!

      """
      Manually confirm an order which is in progress
      """
      confirmOrder(orderId: ID!, paymentContext: JSON, deliveryContext: JSON, comment: String): Order!

      """
      Manually reject an order which is in progress
      """
      rejectOrder(orderId: ID!, paymentContext: JSON, deliveryContext: JSON, comment: String): Order!

      """
      Manually mark an unpaid/partially paid order as fully paid
      """
      payOrder(orderId: ID!): Order!

      """
      Manually mark a undelivered order as delivered
      """
      deliverOrder(orderId: ID!): Order!

      """
      Update E-Mail address of any user or logged in user if userId is not provided
      """
      addEmail(email: String!, userId: ID): User!

      """
      Update E-Mail address of any user or logged in user if userId is not provided
      """
      removeEmail(email: String!, userId: ID): User!

      """
      Set tags of user
      """
      setUserTags(tags: [LowerCaseString]!, userId: ID!): User!

      """
      Update Profile of any user or logged in user if userId is not provided
      """
      updateUserProfile(profile: UserProfileInput, meta: JSON, userId: ID): User!

      """
      Remove any user or logged in user if userId is not provided
      """
      removeUser(userId: ID, removeUserReviews: Boolean): User!

      """
      Enroll a new user, setting enroll to true will let the user choose his password (e-mail gets sent)
      """
      enrollUser(profile: UserProfileInput!, email: String!, password: String): User!

      """
      Forcefully trigger an enrollment email for already added users by e-mail
      """
      sendEnrollmentEmail(email: String!): SuccessResponse

      """
      Set username for a specific user
      """
      setUsername(username: String!, userId: ID!): User!

      """
      Set a new password for a specific user
      """
      setPassword(newPassword: String, userId: ID!): User!

      """
      Set roles of a user
      """
      setRoles(roles: [String!]!, userId: ID!): User!

      """
      Create a new product
      """
      createProduct(product: CreateProductInput!, texts: [ProductTextInput!]): Product!

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
      updateProductCommerce(productId: ID!, commerce: UpdateProductCommerceInput!): Product

      """
      Modify delivery part of a product
      """
      updateProductSupply(productId: ID!, supply: UpdateProductSupplyInput!): Product

      """
      Modify plan part of a product
      """
      updateProductPlan(productId: ID!, plan: UpdateProductPlanInput!): Product

      """
      Modify tokenization part of a product
      """
      updateProductTokenization(
        productId: ID!
        tokenization: UpdateProductTokenizationInput!
      ): TokenizedProduct

      """
      Modify warehousing part of a product
      """
      updateProductWarehousing(productId: ID!, warehousing: UpdateProductWarehousingInput!): Product

      """
      Modify localized texts part of a product
      """
      updateProductTexts(productId: ID!, texts: [ProductTextInput!]!): [ProductTexts!]!

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
      updateProductMediaTexts(
        productMediaId: ID!
        texts: [ProductMediaTextInput!]!
      ): [ProductMediaTexts!]!

      """
      Removes product variation with the provided ID
      """
      removeProductVariation(productVariationId: ID!): ProductVariation!

      """
      Removes product option value for product variation with the provided variation option value
      """
      removeProductVariationOption(
        productVariationId: ID!
        productVariationOptionValue: String!
      ): ProductVariation!

      """
      Update product variation texts with the specified locales for product variations
      that match the provided variation ID and production option value
      """
      updateProductVariationTexts(
        productVariationId: ID!
        productVariationOptionValue: String
        texts: [ProductVariationTextInput!]!
      ): [ProductVariationTexts!]!

      """
      Creates new product variation for a product.
      """
      createProductVariation(
        productId: ID!
        variation: CreateProductVariationInput!
        texts: [ProductVariationTextInput!]
      ): ProductVariation!

      """
      Adds one product as bundle for another products
      """
      createProductBundleItem(productId: ID!, item: CreateProductBundleItemInput!): Product!

      """
      Removes products bundle item found at the given 0 based index.
      """
      removeBundleItem(productId: ID!, index: Int!): Product!

      """
      Adds variation option to an existing product variations
      """
      createProductVariationOption(
        productVariationId: ID!
        option: String!
        texts: [ProductVariationTextInput!]
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
      removeProductAssignment(proxyId: ID!, vectors: [ProductAssignmentVectorInput!]!): Product!

      """
      Adds new language along with the user who created it
      """
      createLanguage(language: CreateLanguageInput!): Language!

      """
      Updates the specified language.
      """
      updateLanguage(language: UpdateLanguageInput!, languageId: ID!): Language!

      """
      Deletes the specified languages
      """
      removeLanguage(languageId: ID!): Language!

      createCountry(country: CreateCountryInput!): Country!

      """
      Updates provided country information
      """
      updateCountry(country: UpdateCountryInput!, countryId: ID!): Country!

      """
      Deletes the specified country
      """
      removeCountry(countryId: ID!): Country!

      createCurrency(currency: CreateCurrencyInput!): Currency!

      """
      Updates the specified currency
      """
      updateCurrency(currency: UpdateCurrencyInput!, currencyId: ID!): Currency!

      """
      Deletes the specified currency
      """
      removeCurrency(currencyId: ID!): Currency!

      """
      Adds new payment provider
      """
      createPaymentProvider(paymentProvider: CreatePaymentProviderInput!): PaymentProvider!

      """
      Updates payment provider information with the provided ID
      """
      updatePaymentProvider(
        paymentProvider: UpdateProviderInput!
        paymentProviderId: ID!
      ): PaymentProvider!

      """
      Deletes the specified payment provider by setting the deleted filed to current timestamp.
      Note the payment provider is still available only it’s status is deleted
      """
      removePaymentProvider(paymentProviderId: ID!): PaymentProvider!

      """
      Creates new delivery provider
      """
      createDeliveryProvider(deliveryProvider: CreateDeliveryProviderInput!): DeliveryProvider!

      """
      Updates the delivery provider specified
      """
      updateDeliveryProvider(
        deliveryProvider: UpdateProviderInput!
        deliveryProviderId: ID!
      ): DeliveryProvider!

      """
      Deletes a delivery provider by setting the deleted field to current timestamp.
      Note the delivery provider still exists.
      """
      removeDeliveryProvider(deliveryProviderId: ID!): DeliveryProvider!

      """
      Creates new warehouse provider.
      """
      createWarehousingProvider(
        warehousingProvider: CreateWarehousingProviderInput!
      ): WarehousingProvider!

      """
      Updates warehousing provider information with the provided ID
      """
      updateWarehousingProvider(
        warehousingProvider: UpdateProviderInput!
        warehousingProviderId: ID!
      ): WarehousingProvider!

      """
      Deletes the specified warehousing provider by setting the deleted filed to current timestamp.
      Note warehousing provider still exists in the system after successful
      completing of this operation with status deleted.
      """
      removeWarehousingProvider(warehousingProviderId: ID!): WarehousingProvider!

      """
      Creates new assortment.
      """
      createAssortment(assortment: CreateAssortmentInput!, texts: [AssortmentTextInput!]): Assortment!

      """
      Updates the provided assortment
      """
      updateAssortment(assortment: UpdateAssortmentInput!, assortmentId: ID!): Assortment!

      """
      Makes the assortment provided as the base assortment and make
      any other existing base assortment regular assortments.
      """
      setBaseAssortment(assortmentId: ID!): Assortment!

      """
      Removes assortment with the provided ID
      """
      removeAssortment(assortmentId: ID!): Assortment!

      """
      Modify localized texts part of an assortment
      """
      updateAssortmentTexts(assortmentId: ID!, texts: [AssortmentTextInput!]!): [AssortmentTexts!]!

      """
      Add a new product to an assortment
      """
      addAssortmentProduct(
        assortmentId: ID!
        productId: ID!
        tags: [LowerCaseString!]
      ): AssortmentProduct!

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
      addAssortmentLink(
        parentAssortmentId: ID!
        childAssortmentId: ID!
        tags: [LowerCaseString!]
      ): AssortmentLink!

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
      addAssortmentFilter(assortmentId: ID!, filterId: ID!, tags: [LowerCaseString!]): AssortmentFilter!

      """
      Remove a product from an assortment
      """
      removeAssortmentFilter(assortmentFilterId: ID!): AssortmentFilter!

      """
      Reorder the products in an assortment
      """
      reorderAssortmentFilters(sortKeys: [ReorderAssortmentFilterInput!]!): [AssortmentFilter!]!

      """
      Remove a media asset from a assortment
      """
      removeAssortmentMedia(assortmentMediaId: ID!): AssortmentMedia!

      """
      Reorder a media asset (first is primary)
      """
      reorderAssortmentMedia(sortKeys: [ReorderAssortmentMediaInput!]!): [AssortmentMedia!]!

      """
      Modify localized texts part of a assortment media asset
      """
      updateAssortmentMediaTexts(
        assortmentMediaId: ID!
        texts: [AssortmentMediaTextInput!]!
      ): [AssortmentMediaTexts!]!

      """
      Creates new Filter along with the user who created it.
      """
      createFilter(filter: CreateFilterInput!, texts: [FilterTextInput!]): Filter!

      """
      Updates the specified filter with the information passed.
      """
      updateFilter(filter: UpdateFilterInput!, filterId: ID!): Filter!

      """
      Deletes the specified filter
      """
      removeFilter(filterId: ID!): Filter!

      """
      Removes the filter option from the specified filter.
      """
      removeFilterOption(filterId: ID!, filterOptionValue: String!): Filter!

      """
      Updates or created specified filter texts for filter with ID provided and locale and optionally filterOptionValue
      """
      updateFilterTexts(
        filterId: ID!
        filterOptionValue: String
        texts: [FilterTextInput!]!
      ): [FilterTexts!]!

      """
      Adds new option to filters
      """
      createFilterOption(filterId: ID!, option: String!, texts: [FilterTextInput!]): Filter!

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

      """
      Add a vote to a ProductReview.
      If there there is a previous vote from the user invoking this it will be removed and updated with the new vote
      """
      addProductReviewVote(
        productReviewId: ID!
        type: ProductReviewVoteType!
        meta: JSON
      ): ProductReview!

      """
      Remove a vote from a ProductReview
      """
      removeProductReviewVote(productReviewId: ID!, type: ProductReviewVoteType): ProductReview!

      """
      Request for Proposal (RFP) for the specified product
      """
      requestQuotation(productId: ID!, configuration: [ProductConfigurationParameterInput!]): Quotation!

      """
      Verify quotation request elligibility. and marks requested quotations as verified if it is
      """
      verifyQuotation(quotationId: ID!, quotationContext: JSON): Quotation!

      """
      Reject an RFP, this is possible as long as a quotation is not fullfilled
      """
      rejectQuotation(quotationId: ID!, quotationContext: JSON): Quotation!

      """
      Make a proposal as answer to the RFP by changing its status to PROCESSED
      """
      makeQuotationProposal(quotationId: ID!, quotationContext: JSON): Quotation!

      """
      Toggle Bookmark state on a product as currently logged in user,
      Does not work when multiple bookmarks with different explicit meta configurations exist.
      In those cases please use createBookmark and removeBookmark
      """
      bookmark(productId: ID!, bookmarked: Boolean = true): Bookmark!

      """
      Create a bookmark for a specific user
      """
      createBookmark(productId: ID!, userId: ID!, meta: JSON): Bookmark!

      """
      Remove an existing bookmark by ID
      """
      removeBookmark(bookmarkId: ID!): Bookmark!

      """
      Add work to the work queue. Each type has its own input shape. If you pinpoint the worker by setting it
      during creation, the work will be only run by the worker who identifies as that worker.
      """
      addWork(
        type: WorkType!
        priority: Int! = 0
        input: JSON
        originalWorkId: ID
        scheduled: Timestamp
        retries: Int! = 20
        worker: String
      ): Work

      """
      Get the next task from the worker queue. This will also mark the task as "started".
      Optional worker to identify the worker.
      """
      allocateWork(types: [WorkType], worker: String): Work

      """
      This will pick up non-external work, execute, await result and finish
      it up on the target system. This function allows you to do work queue "ticks"
      from outside instead of waiting for default Cron and Event Listener to trigger
      and can be helpful in serverless environments.
      """
      processNextWork(worker: String): Work

      """
      Register a work attempt manually.
      Note: Usually, work attempts are handled internally by the inbuilt cron
      worker. This mutation is part of the interface for "outside" workers.
      """
      finishWork(
        workId: ID!
        result: JSON
        error: JSON
        success: Boolean
        worker: String
        started: Timestamp
        finished: Timestamp
      ): Work!

      """
      Manually remove a work
      """
      removeWork(workId: ID!): Work!

      """
      Register credentials for an existing payment provider allowing to store and use them
      for later payments (1-click checkout or enrollments)
      """
      registerPaymentCredentials(transactionContext: JSON!, paymentProviderId: ID!): PaymentCredentials

      """
      Make's the provided payment credential as the users preferred method of payment.
      """
      markPaymentCredentialsPreferred(paymentCredentialsId: ID!): PaymentCredentials

      """
      Deletes the specified payment credential.
      """
      removePaymentCredentials(paymentCredentialsId: ID!): PaymentCredentials
      """
      Sign a generic payment provider for registration
      """
      signPaymentProviderForCredentialRegistration(
        paymentProviderId: ID!
        transactionContext: JSON
      ): String

      """
      Sign a generic order payment
      """
      signPaymentProviderForCheckout(orderPaymentId: ID, transactionContext: JSON): String!

      prepareProductMediaUpload(mediaName: String!, productId: ID!): MediaUploadTicket!
      prepareAssortmentMediaUpload(mediaName: String!, assortmentId: ID!): MediaUploadTicket!
      prepareUserAvatarUpload(mediaName: String!, userId: ID): MediaUploadTicket!
      confirmMediaUpload(mediaUploadTicketId: ID!, size: Int!, type: String!): Media!

      """
      Tokenize
      """
      invalidateToken(tokenId: ID!): Token!
      exportToken(tokenId: ID!, quantity: Int! = 1, recipientWalletAddress: String!): Token!

      """
      Store user W3C Push subscription object
      """
      addPushSubscription(subscription: JSON!, unsubscribeFromOtherUsers: Boolean): User!

      """
      Remove user W3C push subscription object
      """
      removePushSubscription(p256dh: String!): User!
      deleteUserProductReviews(userId: ID): Boolean
    }
  `,
];
