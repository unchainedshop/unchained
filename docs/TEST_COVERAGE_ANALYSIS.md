# Unchained E-Commerce Platform - Test Coverage Analysis

This document provides a comprehensive overview of GraphQL API and REST endpoint test coverage.

## Summary Statistics

| Category | Total | Tested | Untested | Coverage |
|----------|-------|--------|----------|----------|
| **GraphQL Mutations** | 152 | 132 | 20 | 87% |
| **GraphQL Queries** | 68 | 46 | 22 | 68% |
| **Total GraphQL** | 220 | 178 | 42 | **81%** |
| **REST Endpoints** | 11 | 5 | 6 | **45%** |

## REST Endpoints Coverage

| Status | Method | URL | Handler | Category | Tested In |
|--------|--------|-----|---------|----------|-----------|
| ❌ | POST | `/payment/stripe` | stripeHandler | Payment Webhooks | - |
| ✅ | POST | `/payment/datatrans/webhook` | datatransHandler | Payment Webhooks | plugins-datatrans.test.js |
| ✅ | POST | `/payment/postfinance-checkout` | postfinanceCheckoutHandler | Payment Webhooks | plugins-postfinance-checkout.test.js |
| ✅ | POST | `/payment/apple-iap` | appleIAPHandler | Payment Webhooks | plugins-apple-iap.test.js |
| ✅ | POST | `/payment/payrexx` | payrexxHandler | Payment Webhooks | plugins-payrexx.test.js |
| ❌ | GET | `/payment/saferpay/webhook` | saferpayHandler | Payment Webhooks | - |
| ❌ | GET/PUT/OPTIONS | `/gridfs/:directoryName/:fileName` | gridfsHandler | File Storage | - |
| ✅ | POST | `/payment/cryptopay` | cryptopayHandler | Payment Webhooks | plugins-cryptopay.test.js |
| ❌ | GET/POST/DELETE | `/rest/apple-wallet` | appleWalletHandler | Ticketing | - |
| ❌ | POST | `/rest/google-wallet` | googleWalletHandler | Ticketing | - |
| ❌ | POST | `/rest/print_tickets` | printTicketsHandler | Ticketing | - |

## GraphQL Mutations Coverage

| Status | Mutation | Category |
|--------|----------|----------|
| ✅ | `addAssortmentFilter` | Assortments |
| ✅ | `addAssortmentLink` | Assortments |
| ✅ | `addAssortmentProduct` | Assortments |
| ✅ | `createAssortment` | Assortments |
| ✅ | `removeAssortment` | Assortments |
| ✅ | `removeAssortmentFilter` | Assortments |
| ✅ | `removeAssortmentMedia` | Assortments |
| ✅ | `removeAssortmentProduct` | Assortments |
| ✅ | `reorderAssortmentFilters` | Assortments |
| ✅ | `reorderAssortmentLinks` | Assortments |
| ✅ | `reorderAssortmentMedia` | Assortments |
| ✅ | `reorderAssortmentProducts` | Assortments |
| ✅ | `setBaseAssortment` | Assortments |
| ✅ | `updateAssortment` | Assortments |
| ✅ | `updateAssortmentMediaTexts` | Assortments |
| ✅ | `updateAssortmentTexts` | Assortments |
| ✅ | `addEmail` | Authentication & Users |
| ✅ | `changePassword` | Authentication & Users |
| ✅ | `createUser` | Authentication & Users |
| ✅ | `enrollUser` | Authentication & Users |
| ✅ | `forgotPassword` | Authentication & Users |
| ❌ | `impersonate` | Authentication & Users |
| ✅ | `loginWithPassword` | Authentication & Users |
| ❌ | `loginWithWebAuthn` | Authentication & Users |
| ✅ | `removeEmail` | Authentication & Users |
| ❌ | `removeUser` | Authentication & Users |
| ✅ | `resetPassword` | Authentication & Users |
| ✅ | `sendVerificationEmail` | Authentication & Users |
| ✅ | `setPassword` | Authentication & Users |
| ✅ | `setRoles` | Authentication & Users |
| ✅ | `setUsername` | Authentication & Users |
| ✅ | `verifyEmail` | Authentication & Users |
| ✅ | `bookmark` | Bookmarks |
| ✅ | `removeBookmark` | Bookmarks |
| ✅ | `createDeliveryProvider` | Delivery |
| ✅ | `removeDeliveryProvider` | Delivery |
| ✅ | `updateDeliveryProvider` | Delivery |
| ✅ | `activateEnrollment` | Enrollments |
| ✅ | `createEnrollment` | Enrollments |
| ✅ | `terminateEnrollment` | Enrollments |
| ✅ | `updateEnrollment` | Enrollments |
| ❌ | `pageView` | Events & Tracking |
| ✅ | `createFilter` | Filters |
| ✅ | `createFilterOption` | Filters |
| ✅ | `removeFilter` | Filters |
| ✅ | `removeFilterOption` | Filters |
| ✅ | `updateFilter` | Filters |
| ✅ | `updateFilterTexts` | Filters |
| ✅ | `confirmOrder` | Order Management |
| ✅ | `deliverOrder` | Order Management |
| ✅ | `payOrder` | Order Management |
| ✅ | `rejectOrder` | Order Management |
| ✅ | `updateOrderDeliveryPickUp` | Order Management |
| ✅ | `updateOrderDeliveryShipping` | Order Management |
| ✅ | `addCartDiscount` | Orders & Cart |
| ✅ | `addCartProduct` | Orders & Cart |
| ✅ | `addCartQuotation` | Orders & Cart |
| ✅ | `checkoutCart` | Orders & Cart |
| ✅ | `createCart` | Orders & Cart |
| ✅ | `emptyCart` | Orders & Cart |
| ✅ | `removeCartDiscount` | Orders & Cart |
| ✅ | `removeCartItem` | Orders & Cart |
| ✅ | `updateCart` | Orders & Cart |
| ❌ | `updateCartDeliveryPickUp` | Orders & Cart |
| ❌ | `updateCartDeliveryShipping` | Orders & Cart |
| ✅ | `updateCartItem` | Orders & Cart |
| ❌ | `updateCartPaymentGeneric` | Orders & Cart |
| ❌ | `updateCartPaymentInvoice` | Orders & Cart |
| ✅ | `addMultipleCartProducts` | Other |
| ✅ | `addWork` | Other |
| ✅ | `allocateWork` | Other |
| ✅ | `confirmMediaUpload` | Other |
| ✅ | `createBookmark` | Other |
| ✅ | `createCountry` | Other |
| ✅ | `createCurrency` | Other |
| ✅ | `createLanguage` | Other |
| ✅ | `finishWork` | Other |
| ✅ | `markPaymentCredentialsPreferred` | Other |
| ✅ | `prepareAssortmentMediaUpload` | Other |
| ✅ | `prepareProductMediaUpload` | Other |
| ✅ | `prepareUserAvatarUpload` | Other |
| ✅ | `registerPaymentCredentials` | Other |
| ✅ | `removeAssortmentLink` | Other |
| ✅ | `removeCountry` | Other |
| ✅ | `removeCurrency` | Other |
| ✅ | `removeLanguage` | Other |
| ✅ | `removeOrder` | Other |
| ✅ | `removePaymentCredentials` | Other |
| ✅ | `removeWork` | Other |
| ✅ | `sendEnrollmentEmail` | Other |
| ✅ | `setOrderDeliveryProvider` | Other |
| ✅ | `setOrderPaymentProvider` | Other |
| ✅ | `setUserTags` | Other |
| ✅ | `updateCountry` | Other |
| ✅ | `updateCurrency` | Other |
| ✅ | `updateLanguage` | Other |
| ✅ | `updateOrderPaymentGeneric` | Other |
| ✅ | `updateOrderPaymentInvoice` | Other |
| ✅ | `updateProductPlan` | Other |
| ✅ | `updateUserProfile` | Other |
| ✅ | `createPaymentProvider` | Payment |
| ✅ | `removePaymentProvider` | Payment |
| ✅ | `signPaymentProviderForCheckout` | Payment |
| ✅ | `signPaymentProviderForCredentialRegistration` | Payment |
| ✅ | `updatePaymentProvider` | Payment |
| ✅ | `createProductBundleItem` | Product Bundles |
| ✅ | `removeBundleItem` | Product Bundles |
| ✅ | `addProductReviewVote` | Product Reviews |
| ✅ | `createProductReview` | Product Reviews |
| ✅ | `removeProductReview` | Product Reviews |
| ✅ | `removeProductReviewVote` | Product Reviews |
| ❌ | `removeUserProductReviews` | Product Reviews |
| ✅ | `updateProductReview` | Product Reviews |
| ✅ | `createProductVariation` | Product Variations |
| ✅ | `createProductVariationOption` | Product Variations |
| ✅ | `removeProductVariation` | Product Variations |
| ✅ | `removeProductVariationOption` | Product Variations |
| ✅ | `updateProductVariationTexts` | Product Variations |
| ✅ | `createProduct` | Products |
| ✅ | `publishProduct` | Products |
| ✅ | `removeProduct` | Products |
| ✅ | `removeProductMedia` | Products |
| ✅ | `reorderProductMedia` | Products |
| ✅ | `unpublishProduct` | Products |
| ✅ | `updateProduct` | Products |
| ✅ | `updateProductCommerce` | Products |
| ✅ | `updateProductMediaTexts` | Products |
| ✅ | `updateProductSupply` | Products |
| ✅ | `updateProductTexts` | Products |
| ❌ | `updateProductTokenization` | Products |
| ✅ | `updateProductWarehousing` | Products |
| ❌ | `addPushSubscription` | Push Notifications |
| ❌ | `removePushSubscription` | Push Notifications |
| ✅ | `makeQuotationProposal` | Quotations |
| ✅ | `rejectQuotation` | Quotations |
| ✅ | `requestQuotation` | Quotations |
| ✅ | `verifyQuotation` | Quotations |
| ❌ | `exportToken` | Tokens |
| ❌ | `invalidateToken` | Tokens |
| ✅ | `addProductAssignment` | Warehousing Assignments |
| ✅ | `removeProductAssignment` | Warehousing Assignments |
| ✅ | `createWarehousingProvider` | Warehousing |
| ✅ | `removeWarehousingProvider` | Warehousing |
| ✅ | `updateWarehousingProvider` | Warehousing |
| ❌ | `addWeb3Address` | Web3 & WebAuthn |
| ❌ | `addWebAuthnCredentials` | Web3 & WebAuthn |
| ✅ | `createWebAuthnCredentialCreationOptions` | Web3 & WebAuthn |
| ✅ | `createWebAuthnCredentialRequestOptions` | Web3 & WebAuthn |
| ❌ | `removeWeb3Address` | Web3 & WebAuthn |
| ❌ | `removeWebAuthnCredentials` | Web3 & WebAuthn |
| ❌ | `verifyWeb3Address` | Web3 & WebAuthn |
| ❌ | `processNextWork` | Work Queue |

## GraphQL Queries Coverage

| Status | Query | Category |
|--------|-------|----------|
| ✅ | `assortment` | Assortments |
| ✅ | `assortments` | Assortments |
| ✅ | `assortmentsCount` | Assortments |
| ❌ | `translatedAssortmentMediaTexts` | Assortments |
| ✅ | `translatedAssortmentTexts` | Assortments |
| ✅ | `deliveryInterfaces` | Delivery |
| ✅ | `deliveryProvider` | Delivery |
| ✅ | `deliveryProviders` | Delivery |
| ✅ | `deliveryProvidersCount` | Delivery |
| ✅ | `enrollment` | Enrollments |
| ✅ | `enrollments` | Enrollments |
| ❌ | `enrollmentsCount` | Enrollments |
| ❌ | `event` | Events & Statistics |
| ❌ | `eventStatistics` | Events & Statistics |
| ❌ | `events` | Events & Statistics |
| ❌ | `eventsCount` | Events & Statistics |
| ❌ | `workQueueCount` | Events & Statistics |
| ❌ | `workStatistics` | Events & Statistics |
| ✅ | `filter` | Filters |
| ✅ | `filters` | Filters |
| ✅ | `filtersCount` | Filters |
| ✅ | `translatedFilterTexts` | Filters |
| ✅ | `countries` | Localization |
| ❌ | `countriesCount` | Localization |
| ✅ | `currencies` | Localization |
| ❌ | `currenciesCount` | Localization |
| ✅ | `languages` | Localization |
| ❌ | `languagesCount` | Localization |
| ✅ | `order` | Orders |
| ❌ | `orderStatistics` | Orders |
| ✅ | `orders` | Orders |
| ✅ | `ordersCount` | Orders |
| ✅ | `country` | Other |
| ✅ | `currency` | Other |
| ✅ | `language` | Other |
| ✅ | `work` | Other |
| ✅ | `workQueue` | Other |
| ✅ | `paymentInterfaces` | Payment |
| ✅ | `paymentProvider` | Payment |
| ✅ | `paymentProviders` | Payment |
| ✅ | `paymentProvidersCount` | Payment |
| ✅ | `productReview` | Product Reviews |
| ✅ | `productReviews` | Product Reviews |
| ❌ | `productReviewsCount` | Product Reviews |
| ✅ | `product` | Products |
| ❌ | `productCatalogPrices` | Products |
| ✅ | `products` | Products |
| ✅ | `productsCount` | Products |
| ❌ | `translatedProductMediaTexts` | Products |
| ❌ | `translatedProductTexts` | Products |
| ✅ | `translatedProductVariationTexts` | Products |
| ✅ | `quotation` | Quotations |
| ✅ | `quotations` | Quotations |
| ❌ | `quotationsCount` | Quotations |
| ✅ | `searchAssortments` | Search |
| ✅ | `searchProducts` | Search |
| ❌ | `token` | Tokens |
| ❌ | `tokens` | Tokens |
| ❌ | `tokensCount` | Tokens |
| ❌ | `validateResetPasswordToken` | Tokens |
| ❌ | `validateVerifyEmailToken` | Tokens |
| ✅ | `user` | Users |
| ✅ | `users` | Users |
| ✅ | `usersCount` | Users |
| ✅ | `warehousingInterfaces` | Warehousing |
| ✅ | `warehousingProvider` | Warehousing |
| ✅ | `warehousingProviders` | Warehousing |
| ✅ | `warehousingProvidersCount` | Warehousing |

## Key Findings

### Missing Test Coverage

#### Critical Payment Webhooks Without Tests:

- ❌ **POST /payment/stripe** (stripeHandler) - No webhook tests found

#### High-Priority Untested GraphQL Operations:

- ❌ **addWeb3Address** (Mutation)
- ❌ **verifyWeb3Address** (Mutation)
- ❌ **removeWeb3Address** (Mutation)
- ❌ **addWebAuthnCredentials** (Mutation)
- ❌ **removeWebAuthnCredentials** (Mutation)
- ❌ **loginWithWebAuthn** (Mutation)
- ❌ **impersonate** (Mutation)

## Recommendations

1. **Stripe Webhook Testing**: Add integration tests for Stripe webhook endpoint (`/payment/stripe`)

2. **Web3 & WebAuthn**: Expand test coverage for Web3 and WebAuthn authentication flows

3. **Product Lifecycle**: Add tests for product publishing/unpublishing workflows

4. **Assortment Management**: Create comprehensive tests for assortment CRUD operations

5. **Filter Management**: Add tests for filter creation and management

6. **Admin Operations**: Test admin-specific operations like user impersonation

7. **Statistics & Analytics**: Add tests for statistics and analytics queries

8. **Ticketing Endpoints**: Add integration tests for Apple Wallet, Google Wallet, and PDF printing endpoints

