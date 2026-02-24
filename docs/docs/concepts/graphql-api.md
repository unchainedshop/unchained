---
sidebar_position: 7
title: GraphQL API Reference
sidebar_label: GraphQL API
description: Complete reference for queries, mutations, types, and scalars in the Unchained Engine GraphQL API
---

# GraphQL API Reference

Unchained Engine exposes a comprehensive GraphQL API built with [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server). The API is available at the `/graphql` endpoint.

:::tip Interactive Explorer
Use the [GraphQL Playground](https://engine.unchained.shop/graphql) to explore the schema interactively with auto-completion and documentation.
:::

## Custom Scalars

| Scalar | Description |
|--------|-------------|
| `JSON` | Arbitrary JSON object |
| `DateTime` | ISO 8601 date-time string |
| `Date` | Date value |
| `Timestamp` | Unix timestamp (integer) |
| `LowerCaseString` | String that enforces lowercase |
| `Locale` | BCP 47 locale code (e.g., `en`, `de-CH`) |

## Directives

### `@cacheControl`

Controls HTTP caching behavior for fields and types:

```graphql
directive @cacheControl(maxAge: Int, scope: CacheControlScope) on FIELD_DEFINITION | OBJECT
```

Scope values: `PUBLIC`, `PRIVATE`

## Queries

### Products

| Query | Arguments | Description |
|-------|-----------|-------------|
| `product` | `productId: ID`, `slug: String` | Get product by ID or slug |
| `products` | `queryString`, `tags`, `slugs`, `limit`, `offset`, `includeDrafts`, `sort` | List products |
| `productsCount` | `tags`, `slugs`, `includeDrafts`, `queryString` | Count products |
| `productCatalogPrices` | `productId: ID!` | Get catalog prices |
| `productReview` | `productReviewId: ID!` | Get a product review |
| `productReviews` | `limit`, `offset`, `sort`, `queryString` | List all reviews |
| `productReviewsCount` | `queryString` | Count reviews |
| `searchProducts` | `queryString`, `filterQuery`, `assortmentId`, `orderBy`, `includeInactive`, `ignoreChildAssortments` | Search products with filters |
| `translatedProductTexts` | `productId: ID!` | Get all translations |
| `translatedProductMediaTexts` | `productMediaId: ID!` | Get media translations |
| `translatedProductVariationTexts` | `productVariationId: ID!`, `productVariationOptionValue: String` | Get variation translations |

### Orders

| Query | Arguments | Description |
|-------|-----------|-------------|
| `order` | `orderId: ID!` | Get order by ID |
| `orders` | `limit`, `offset`, `includeCarts`, `queryString`, `status`, `sort`, `paymentProviderIds`, `deliveryProviderIds`, `dateRange` | List orders |
| `ordersCount` | `includeCarts`, `queryString`, `paymentProviderIds`, `deliveryProviderIds`, `dateRange`, `status` | Count orders |

### Users

| Query | Arguments | Description |
|-------|-----------|-------------|
| `me` | — | Current authenticated user |
| `impersonator` | — | User impersonating current user |
| `user` | `userId: ID` | Get user (defaults to current user) |
| `users` | `limit`, `offset`, `includeGuests`, `queryString`, `sort`, `emailVerified`, `lastLogin`, `tags` | List users |
| `usersCount` | `includeGuests`, `queryString`, `emailVerified`, `lastLogin`, `tags` | Count users |
| `validateResetPasswordToken` | `token: String!` | Validate reset token |
| `validateVerifyEmailToken` | `token: String!` | Validate email token |

### Assortments

| Query | Arguments | Description |
|-------|-----------|-------------|
| `assortment` | `assortmentId: ID`, `slug: String` | Get assortment by ID or slug |
| `assortments` | `queryString`, `tags`, `slugs`, `limit`, `offset`, `includeInactive`, `includeLeaves`, `sort` | List assortments |
| `assortmentsCount` | `tags`, `slugs`, `includeInactive`, `includeLeaves`, `queryString` | Count assortments |
| `searchAssortments` | `queryString`, `assortmentIds`, `orderBy`, `includeInactive` | Search assortments |
| `translatedAssortmentTexts` | `assortmentId: ID!` | Get translations |
| `translatedAssortmentMediaTexts` | `assortmentMediaId: ID!` | Get media translations |

### Filters

| Query | Arguments | Description |
|-------|-----------|-------------|
| `filter` | `filterId: ID` | Get filter by ID |
| `filters` | `limit`, `offset`, `includeInactive`, `queryString`, `sort` | List filters |
| `filtersCount` | `includeInactive`, `queryString` | Count filters |
| `translatedFilterTexts` | `filterId: ID!`, `filterOptionValue: String` | Get translations |

### Localization

| Query | Arguments | Description |
|-------|-----------|-------------|
| `language` | `languageId: ID!` | Get language |
| `languages` | `limit`, `offset`, `includeInactive`, `queryString`, `sort` | List languages |
| `languagesCount` | `includeInactive`, `queryString` | Count languages |
| `country` | `countryId: ID!` | Get country |
| `countries` | `limit`, `offset`, `includeInactive`, `queryString`, `sort` | List countries |
| `countriesCount` | `includeInactive`, `queryString` | Count countries |
| `currency` | `currencyId: ID!` | Get currency |
| `currencies` | `limit`, `offset`, `includeInactive`, `queryString`, `sort` | List currencies |
| `currenciesCount` | `includeInactive`, `queryString` | Count currencies |

### Providers

| Query | Arguments | Description |
|-------|-----------|-------------|
| `paymentProvider` | `paymentProviderId: ID!` | Get payment provider |
| `paymentProviders` | `type: PaymentProviderType` | List payment providers |
| `paymentProvidersCount` | `type: PaymentProviderType` | Count payment providers |
| `paymentInterfaces` | `type: PaymentProviderType` | List available payment interfaces |
| `deliveryProvider` | `deliveryProviderId: ID!` | Get delivery provider |
| `deliveryProviders` | `type: DeliveryProviderType` | List delivery providers |
| `deliveryProvidersCount` | `type: DeliveryProviderType` | Count delivery providers |
| `deliveryInterfaces` | `type: DeliveryProviderType` | List available delivery interfaces |
| `warehousingProvider` | `warehousingProviderId: ID!` | Get warehousing provider |
| `warehousingProviders` | `type: WarehousingProviderType` | List warehousing providers |
| `warehousingProvidersCount` | `type: WarehousingProviderType` | Count warehousing providers |
| `warehousingInterfaces` | `type: WarehousingProviderType` | List available warehousing interfaces |

### Quotations & Enrollments

| Query | Arguments | Description |
|-------|-----------|-------------|
| `quotation` | `quotationId: ID!` | Get quotation |
| `quotations` | `limit`, `offset`, `queryString`, `sort` | List quotations |
| `quotationsCount` | `queryString` | Count quotations |
| `enrollment` | `enrollmentId: ID!` | Get enrollment |
| `enrollments` | `limit`, `offset`, `queryString`, `status`, `sort` | List enrollments |
| `enrollmentsCount` | `queryString`, `status` | Count enrollments |

### Tokens

| Query | Arguments | Description |
|-------|-----------|-------------|
| `token` | `tokenId: ID!` | Get token |
| `tokens` | `queryString`, `limit`, `offset` | List tokens |
| `tokensCount` | `queryString` | Count tokens |

### Work Queue & Events

| Query | Arguments | Description |
|-------|-----------|-------------|
| `work` | `workId: ID!` | Get work item |
| `workQueue` | `limit`, `offset`, `status`, `created`, `queryString`, `sort`, `types` | List work queue |
| `workQueueCount` | `status`, `types`, `created`, `queryString` | Count work items |
| `activeWorkTypes` | — | List registered worker types |
| `event` | `eventId: ID!` | Get event |
| `events` | `types`, `limit`, `offset`, `queryString`, `created`, `sort` | List events |
| `eventsCount` | `types`, `queryString`, `created` | Count events |

### Statistics & System

| Query | Arguments | Description |
|-------|-----------|-------------|
| `shopInfo` | — | Shop configuration and default locale |
| `orderStatistics` | `dateRange` | Order analytics |
| `eventStatistics` | `types`, `dateRange` | Event analytics |
| `workStatistics` | `types`, `dateRange` | Worker analytics |

## Mutations

### Authentication

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `loginWithPassword` | `username`, `email`, `password!` | Login with credentials |
| `loginWithWebAuthn` | `webAuthnPublicKeyCredentials: JSON!` | Login with WebAuthn |
| `loginAsGuest` | — | Create anonymous session |
| `logout` | — | End current session |
| `logoutAllSessions` | — | Invalidate all tokens |
| `impersonate` | `userId: ID!` | Impersonate a user |
| `stopImpersonation` | — | End impersonation |
| `createUser` | `username`, `email`, `password`, `profile`, `webAuthnPublicKeyCredentials` | Register user |
| `changePassword` | `oldPassword!`, `newPassword!` | Change password |
| `forgotPassword` | `email: String!` | Request password reset |
| `resetPassword` | `newPassword!`, `token!` | Reset with token |
| `verifyEmail` | `token: String!` | Verify email address |
| `sendVerificationEmail` | `email` | Resend verification |
| `enrollUser` | `profile!`, `email!`, `password` | Enroll new user |
| `sendEnrollmentEmail` | `email: String!` | Send enrollment email |
| `heartbeat` | — | Update activity info |

### WebAuthn

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createWebAuthnCredentialCreationOptions` | `username!`, `extensionOptions` | Get passkey registration options |
| `createWebAuthnCredentialRequestOptions` | `username`, `extensionOptions` | Get passkey login options |
| `addWebAuthnCredentials` | `credentials: JSON!` | Register passkey |
| `removeWebAuthnCredentials` | `credentialsId: ID!` | Remove passkey |

### User Management

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `updateUserProfile` | `profile`, `meta`, `userId` | Update user profile |
| `removeUser` | `userId`, `removeUserReviews` | Delete user |
| `addEmail` | `email!`, `userId` | Add email address |
| `removeEmail` | `email!`, `userId` | Remove email address |
| `setUserTags` | `tags!`, `userId!` | Set user tags |
| `setUsername` | `username!`, `userId!` | Set username |
| `setPassword` | `newPassword!`, `userId!` | Set password |
| `setRoles` | `roles!`, `userId!` | Set user roles |
| `addPushSubscription` | `subscription!`, `unsubscribeFromOtherUsers` | Add push subscription |
| `removePushSubscription` | `p256dh: String!` | Remove push subscription |
| `pageView` | `path!`, `referrer` | Log page view |

### Web3

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `addWeb3Address` | `address: String!` | Add blockchain address |
| `removeWeb3Address` | `address: String!` | Remove blockchain address |
| `verifyWeb3Address` | `address!`, `hash!` | Verify blockchain address |

### Cart & Checkout

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createCart` | `orderNumber: String!` | Create alternative cart |
| `addCartProduct` | `orderId`, `productId!`, `quantity`, `configuration` | Add product to cart |
| `addMultipleCartProducts` | `orderId`, `items!` | Add multiple products |
| `addCartDiscount` | `orderId`, `code!` | Apply discount code |
| `addCartQuotation` | `orderId`, `quotationId!`, `quantity`, `configuration` | Add quotation to cart |
| `updateCart` | `orderId`, `billingAddress`, `contact`, `meta`, `paymentProviderId`, `deliveryProviderId` | Update cart details |
| `emptyCart` | `orderId` | Remove all items |
| `updateCartItem` | `itemId!`, `quantity`, `configuration` | Update cart item |
| `removeCartItem` | `itemId: ID!` | Remove cart item |
| `removeCartDiscount` | `discountId: ID!` | Remove discount |
| `updateCartDeliveryShipping` | `orderId`, `deliveryProviderId!`, `address`, `meta` | Set shipping delivery |
| `updateCartDeliveryPickUp` | `orderId`, `deliveryProviderId!`, `orderPickUpLocationId!`, `meta` | Set pickup delivery |
| `updateCartPaymentInvoice` | `orderId`, `paymentProviderId!`, `meta` | Set invoice payment |
| `updateCartPaymentGeneric` | `orderId`, `paymentProviderId!`, `meta` | Set generic payment |
| `checkoutCart` | `orderId`, `paymentContext`, `deliveryContext` | Process checkout |

### Order Administration

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `removeOrder` | `orderId: ID!` | Remove open order |
| `confirmOrder` | `orderId!`, `paymentContext`, `deliveryContext`, `comment` | Confirm order |
| `rejectOrder` | `orderId!`, `paymentContext`, `deliveryContext`, `comment` | Reject order |
| `payOrder` | `orderId: ID!` | Mark order as paid |
| `deliverOrder` | `orderId: ID!` | Mark order as delivered |
| `signPaymentProviderForCheckout` | `orderPaymentId`, `transactionContext` | Sign payment |

### Product Management

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createProduct` | `product!`, `texts` | Create product |
| `updateProduct` | `productId!`, `product!` | Update product |
| `publishProduct` | `productId: ID!` | Publish product |
| `unpublishProduct` | `productId: ID!` | Unpublish product |
| `removeProduct` | `productId: ID!` | Delete product |
| `updateProductCommerce` | `productId!`, `commerce!` | Update pricing info |
| `updateProductSupply` | `productId!`, `supply!` | Update supply info |
| `updateProductPlan` | `productId!`, `plan!` | Update plan info |
| `updateProductWarehousing` | `productId!`, `warehousing!` | Update warehousing info |
| `updateProductTokenization` | `productId!`, `tokenization!` | Update tokenization |
| `updateProductTexts` | `productId!`, `texts!` | Update translations |
| `updateProductMediaTexts` | `productMediaId!`, `texts!` | Update media texts |
| `removeProductMedia` | `productMediaId: ID!` | Remove media |
| `reorderProductMedia` | `sortKeys!` | Reorder media |
| `createProductVariation` | `productId!`, `variation!`, `texts` | Create variation |
| `removeProductVariation` | `productVariationId: ID!` | Remove variation |
| `updateProductVariationTexts` | `productVariationId!`, `productVariationOptionValue`, `texts!` | Update variation texts |
| `createProductVariationOption` | `productVariationId!`, `option!`, `texts` | Add variation option |
| `removeProductVariationOption` | `productVariationId!`, `productVariationOptionValue!` | Remove option |
| `createProductBundleItem` | `productId!`, `item!` | Add bundle item |
| `removeBundleItem` | `productId!`, `index!` | Remove bundle item |
| `addProductAssignment` | `proxyId!`, `productId!`, `vectors!` | Link variant |
| `removeProductAssignment` | `proxyId!`, `vectors!` | Unlink variant |

### Assortment Management

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createAssortment` | `assortment!`, `texts` | Create assortment |
| `updateAssortment` | `assortment!`, `assortmentId!` | Update assortment |
| `removeAssortment` | `assortmentId: ID!` | Delete assortment |
| `updateAssortmentTexts` | `assortmentId!`, `texts!` | Update translations |
| `addAssortmentProduct` | `assortmentId!`, `productId!`, `tags` | Add product |
| `removeAssortmentProduct` | `assortmentProductId: ID!` | Remove product |
| `reorderAssortmentProducts` | `sortKeys!` | Reorder products |
| `addAssortmentLink` | `parentAssortmentId!`, `childAssortmentId!`, `tags` | Link assortments |
| `removeAssortmentLink` | `assortmentLinkId: ID!` | Unlink assortments |
| `reorderAssortmentLinks` | `sortKeys!` | Reorder links |
| `addAssortmentFilter` | `assortmentId!`, `filterId!`, `tags` | Add filter |
| `removeAssortmentFilter` | `assortmentFilterId: ID!` | Remove filter |
| `reorderAssortmentFilters` | `sortKeys!` | Reorder filters |
| `removeAssortmentMedia` | `assortmentMediaId: ID!` | Remove media |
| `reorderAssortmentMedia` | `sortKeys!` | Reorder media |
| `updateAssortmentMediaTexts` | `assortmentMediaId!`, `texts!` | Update media texts |

### Filter Management

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createFilter` | `filter!`, `texts` | Create filter |
| `updateFilter` | `filter!`, `filterId!` | Update filter |
| `removeFilter` | `filterId: ID!` | Delete filter |
| `createFilterOption` | `filterId!`, `option!`, `texts` | Add option |
| `removeFilterOption` | `filterId!`, `filterOptionValue!` | Remove option |
| `updateFilterTexts` | `filterId!`, `filterOptionValue`, `texts!` | Update texts |

### Provider Management

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createPaymentProvider` | `paymentProvider!` | Create payment provider |
| `updatePaymentProvider` | `paymentProvider!`, `paymentProviderId!` | Update payment provider |
| `removePaymentProvider` | `paymentProviderId: ID!` | Delete payment provider |
| `signPaymentProviderForCredentialRegistration` | `paymentProviderId!`, `transactionContext` | Sign credential registration |
| `registerPaymentCredentials` | `transactionContext!`, `paymentProviderId!` | Register credentials |
| `markPaymentCredentialsPreferred` | `paymentCredentialsId: ID!` | Set preferred |
| `removePaymentCredentials` | `paymentCredentialsId: ID!` | Delete credentials |
| `createDeliveryProvider` | `deliveryProvider!` | Create delivery provider |
| `updateDeliveryProvider` | `deliveryProvider!`, `deliveryProviderId!` | Update delivery provider |
| `removeDeliveryProvider` | `deliveryProviderId: ID!` | Delete delivery provider |
| `createWarehousingProvider` | `warehousingProvider!` | Create warehousing provider |
| `updateWarehousingProvider` | `warehousingProvider!`, `warehousingProviderId!` | Update warehousing provider |
| `removeWarehousingProvider` | `warehousingProviderId: ID!` | Delete warehousing provider |

### Localization Management

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createLanguage` | `language!` | Create language |
| `updateLanguage` | `language!`, `languageId!` | Update language |
| `removeLanguage` | `languageId: ID!` | Delete language |
| `createCountry` | `country!` | Create country |
| `updateCountry` | `country!`, `countryId!` | Update country |
| `removeCountry` | `countryId: ID!` | Delete country |
| `createCurrency` | `currency!` | Create currency |
| `updateCurrency` | `currency!`, `currencyId!` | Update currency |
| `removeCurrency` | `currencyId: ID!` | Delete currency |

### Quotations

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `requestQuotation` | `productId!`, `configuration` | Request for Proposal |
| `verifyQuotation` | `quotationId!`, `quotationContext` | Verify eligibility |
| `rejectQuotation` | `quotationId!`, `quotationContext` | Reject quotation |
| `makeQuotationProposal` | `quotationId!`, `quotationContext` | Make proposal |

### Enrollments

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createEnrollment` | `plan!`, `billingAddress`, `contact`, `payment`, `delivery`, `meta` | Create enrollment |
| `updateEnrollment` | `enrollmentId`, `plan`, `billingAddress`, `contact`, `payment`, `delivery`, `meta` | Update enrollment |
| `activateEnrollment` | `enrollmentId: ID!` | Activate enrollment |
| `terminateEnrollment` | `enrollmentId: ID!` | Terminate enrollment |

### Reviews

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `createProductReview` | `productId!`, `productReview!` | Create review |
| `updateProductReview` | `productReviewId!`, `productReview!` | Update review |
| `removeProductReview` | `productReviewId: ID!` | Remove review |
| `removeUserProductReviews` | `userId: ID!` | Remove user's reviews |
| `addProductReviewVote` | `productReviewId!`, `type!`, `meta` | Add vote |
| `removeProductReviewVote` | `productReviewId!`, `type` | Remove vote |

### Bookmarks

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `bookmark` | `productId!`, `bookmarked` | Toggle bookmark |
| `createBookmark` | `productId!`, `userId!`, `meta` | Create bookmark |
| `removeBookmark` | `bookmarkId: ID!` | Remove bookmark |

### Work Queue

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `addWork` | `type!`, `priority`, `input`, `originalWorkId`, `scheduled`, `retries`, `worker` | Queue work |
| `allocateWork` | `types`, `worker` | Allocate next task |
| `finishWork` | `workId!`, `result`, `error`, `success`, `worker`, `started`, `finished` | Complete work |
| `processNextWork` | `worker` | Process next work unit |
| `removeWork` | `workId: ID!` | Remove work |

### Media Upload

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `prepareProductMediaUpload` | `mediaName!`, `productId!` | Prepare product media upload |
| `prepareAssortmentMediaUpload` | `mediaName!`, `assortmentId!` | Prepare assortment media upload |
| `prepareUserAvatarUpload` | `mediaName!`, `userId` | Prepare avatar upload |
| `confirmMediaUpload` | `mediaUploadTicketId!`, `size!`, `type!` | Confirm upload |

### Tokens

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `invalidateToken` | `tokenId: ID!` | Invalidate token |
| `exportToken` | `tokenId!`, `quantity`, `recipientWalletAddress!` | Export token |

## Enums

| Enum | Values |
|------|--------|
| `ProductType` | `SIMPLE_PRODUCT`, `CONFIGURABLE_PRODUCT`, `BUNDLE_PRODUCT`, `PLAN_PRODUCT`, `TOKENIZED_PRODUCT` |
| `ProductStatus` | `DRAFT`, `ACTIVE`, `DELETED` |
| `OrderStatus` | `OPEN`, `PENDING`, `CONFIRMED`, `FULFILLED`, `REJECTED` |
| `PaymentProviderType` | `CARD`, `INVOICE`, `GENERIC` |
| `DeliveryProviderType` | `SHIPPING`, `PICKUP`, `LOCAL` |
| `WarehousingProviderType` | `PHYSICAL`, `VIRTUAL` |
| `FilterType` | `SWITCH`, `SINGLE_CHOICE`, `MULTI_CHOICE`, `RANGE` |
| `QuotationStatus` | `REQUESTED`, `PROCESSING`, `PROPOSED`, `FULFILLED`, `REJECTED` |
| `EnrollmentStatus` | `INITIAL`, `ACTIVE`, `PAUSED`, `TERMINATED` |
| `WorkStatus` | `NEW`, `ALLOCATED`, `SUCCESS`, `FAILED`, `DELETED` |
| `SortDirection` | `ASC`, `DESC` |

## Related

- [Extend the GraphQL API](../extend/graphql.md) - Add custom types and resolvers
- [Authentication](./authentication.md) - Authentication patterns
- [Architecture](./architecture.md) - System architecture
