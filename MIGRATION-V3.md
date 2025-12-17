# Migration Guide v2 -> v3

This guide covers the breaking changes and migration steps needed when upgrading from Unchained Engine v2 to v3.

## Required Environment Variables

Add the env `UNCHAINED_TOKEN_SECRET`, use any random string secret to the server. This is required for secure access token generation.

## Schema Changes

We strongly encourage you to use codegen to have statically typed queries and mutations for frontend projects. The following major schema changes have been made:

### Authentication Changes

**Removed Mutations:**
- `Mutation.loginWithOAuth` - removed (use external OIDC providers)
- `Mutation.linkOAuthAccount` - removed
- `Mutation.unlinkOAuthAccount` - removed
- `Mutation.logoutAllSessions` - removed
- `Mutation.buildSecretTOTPAuthURL` - removed (use external OIDC providers for 2FA)
- `Mutation.enableTOTP` - removed
- `Mutation.disableTOTP` - removed
- `Mutation.updateUserAvatar` - removed, use PUT upload instead

**Removed Types:**
- `User.isTwoFactorEnabled` - removed
- `User.oAuthAccounts` - removed
- `Shop.oAuthProviders` - removed

**LoginMethodResponse Changes:**
```diff
type LoginMethodResponse {
-  id: String!
-  token: String!
+  _id: String!  # Session ID
   tokenExpires: DateTime
   user: User
}
```

**Important:** `LoginMethodResponse.token` has been removed. Use server-side cookies or access-keys instead for authentication.

### Password Parameter Renames

All password-related parameters have been renamed from `plainPassword` to `password`:

```diff
- loginWithPassword(username: String, email: String, plainPassword: String, totpCode: String): LoginMethodResponse
+ loginWithPassword(username: String, email: String, password: String!): LoginMethodResponse

- createUser(username: String, email: String, webAuthnPublicKeyCredentials: JSON, plainPassword: String, profile: UserProfileInput): LoginMethodResponse
+ createUser(username: String, email: String, webAuthnPublicKeyCredentials: JSON, password: String, profile: UserProfileInput): LoginMethodResponse

- changePassword(oldPlainPassword: String, newPlainPassword: String): SuccessResponse
+ changePassword(oldPassword: String, newPassword: String): SuccessResponse

- resetPassword(newPlainPassword: String, token: String!): LoginMethodResponse
+ resetPassword(newPassword: String, token: String!): LoginMethodResponse

- enrollUser(profile: UserProfileInput!, email: String!, plainPassword: String): User!
+ enrollUser(profile: UserProfileInput!, email: String!, password: String): User!

- setPassword(newPlainPassword: String, userId: ID!): User!
+ setPassword(newPassword: String, userId: ID!): User!
```

### logout Mutation

```diff
- logout(token: String): SuccessResponse
+ logout: SuccessResponse
```

### Impersonation Mutations Moved

The impersonation mutations have been moved to a different location in the schema but are still available:

```graphql
impersonate(userId: ID!): LoginMethodResponse!
stopImpersonation: LoginMethodResponse
```

`Query.impersonator` now returns the user impersonating the currently logged in user.

### Media Upload Changes

Direct file upload mutations have been removed in favor of PUT uploads:

**Removed Mutations:**
- `Mutation.addProductMedia(productId: ID!, media: Upload!)` - use PUT upload
- `Mutation.addAssortmentMedia(assortmentId: ID!, media: Upload!)` - use PUT upload
- `Mutation.updateUserAvatar(avatar: Upload!, userId: ID)` - use PUT upload

### Create Mutations with Texts

Create mutations no longer accept localized data like `title` in the main input. Instead, provide texts with a new second parameter:

```diff
- createProduct(product: CreateProductInput!): Product!
+ createProduct(product: CreateProductInput!, texts: [ProductTextInput!]): Product!

- createProductVariation(productId: ID!, variation: CreateProductVariationInput!): ProductVariation!
+ createProductVariation(productId: ID!, variation: CreateProductVariationInput!, texts: [ProductVariationTextInput!]): ProductVariation!

- createProductVariationOption(productVariationId: ID!, option: CreateProductVariationOptionInput!): ProductVariation!
+ createProductVariationOption(productVariationId: ID!, option: String!, texts: [ProductVariationTextInput!]): ProductVariation!

- createAssortment(assortment: CreateAssortmentInput!): Assortment!
+ createAssortment(assortment: CreateAssortmentInput!, texts: [AssortmentTextInput!]): Assortment!

- createFilter(filter: CreateFilterInput!): Filter!
+ createFilter(filter: CreateFilterInput!, texts: [FilterTextInput!]): Filter!

- createFilterOption(filterId: ID!, option: CreateFilterOptionInput!): Filter!
+ createFilterOption(filterId: ID!, option: String!, texts: [FilterTextInput!]): Filter!
```

**Input types renamed:**
- `CreateProductInput` no longer has `title`
- `CreateProductVariationInput` no longer has `title`
- `CreateProductVariationOptionInput` replaced by simple `String!` option parameter
- `CreateAssortmentInput` no longer has `title`
- `CreateFilterInput` no longer has `title`
- `CreateFilterOptionInput` replaced by simple `String!` option parameter
- `UpdateProductTextInput` → `ProductTextInput`
- `UpdateProductMediaTextInput` → `ProductMediaTextInput`
- `UpdateProductVariationTextInput` → `ProductVariationTextInput`
- `UpdateAssortmentTextInput` → `AssortmentTextInput`
- `UpdateAssortmentMediaTextInput` → `AssortmentMediaTextInput`
- `UpdateFilterTextInput` → `FilterTextInput`

### Locale Type Changes

All `locale` fields that were `String` are now `Locale` (a validated scalar type):

- `ProductTextInput.locale`: `String!` → `Locale!`
- `ProductMediaTextInput.locale`: `String!` → `Locale!`
- `ProductVariationTextInput.locale`: `String!` → `Locale!`
- `AssortmentTextInput.locale`: `String!` → `Locale!`
- `AssortmentMediaTextInput.locale`: `String!` → `Locale!`
- `FilterTextInput.locale`: `String!` → `Locale!`
- `AssortmentTexts.locale`: `String` → `Locale`
- `AssortmentMediaTexts.locale`: `String` → `Locale`
- `FilterTexts.locale`: `String` → `Locale`
- `UserLoginTracker.locale`: `String` → `Locale`

### _id Removals

The following types no longer have an `_id` field (reduces caching issues and code weight):
- `Price._id` **removed**
- `Stock._id` **removed**
- `Dispatch._id` **removed**
- `PriceRange._id` **removed**

### Other Schema Changes

```diff
# Return type changed
- addMultipleCartProducts(orderId: ID, items: [OrderItemInput!]!): [OrderItem]!
+ addMultipleCartProducts(orderId: ID, items: [OrderItemInput!]!): Order!

# removeUser has new parameter
- removeUser(userId: ID): User!
+ removeUser(userId: ID, removeUserReviews: Boolean): User!

# New mutation for removing product reviews
+ removeUserProductReviews(userId: ID!): Boolean!

# WebAuthn mutations now return nullable JSON
- createWebAuthnCredentialCreationOptions(username: String!, extensionOptions: JSON): JSON!
+ createWebAuthnCredentialCreationOptions(username: String!, extensionOptions: JSON): JSON

- createWebAuthnCredentialRequestOptions(username: String, extensionOptions: JSON): JSON!
+ createWebAuthnCredentialRequestOptions(username: String, extensionOptions: JSON): JSON

# New query for tokens count
+ tokensCount(queryString: String): Int!

# Country input no longer has deprecated field
- CreateCountryInput.defaultCurrencyId (deprecated field removed)
```

### Behavioral Changes

**Cart Totals:** Cart totals are now `null` if there is no item in the cart. Frontend must default to an amount of 0. This change communicates that an order without items cannot be priced (delivery/payment fees depend on what's being ordered).

## Apollo to Yoga

Boot.ts files need to be migrated in order to work with the new Yoga GraphQL Server.

First: Dependencies `npm install --save @graphql-yoga/plugin-response-cache graphql-yoga cookie`
`npm uninstall @apollo/server-plugin-response-cache @apollo/server apollo-graphiql-playground`

Remove

```js
import {
  startPlatform,
  withAccessToken,
  setAccessToken,
  connectPlatformToExpress4,
} from '@unchainedshop/platform';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageGraphiQLPlayground } from 'apollo-graphiql-playground';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
```

Add

```js
import cookie from "cookie";
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
```

Change startPlatform from:

```js
const engine = await startPlatform({
    introspection: true,
    cache,
    plugins: [
        // Install a landing page plugin based on NODE_ENV
        ApolloServerPluginCacheControl({ calculateHttpHeaders: false }),
        ApolloServerPluginDrainHttpServer({ httpServer }),
        ApolloServerPluginLandingPageGraphiQLPlayground({
            shouldPersistHeaders: true,
        }),
    ],
    options: {
        accounts: {
            autoMessagingAfterUserCreation: false,
            server: {
                loginExpirationInDays: 180,
            }
        },
    },
    context: withAccessToken(),
});

await engine.apolloGraphQLServer.start();
connectPlatformToExpress4(app, engine, { corsOrigins: [] });
```

to:

```js
const engine = await startPlatform({
  options: {
    users: {
      autoMessagingAfterUserCreation: false
    }
  }
});
connect(app, engine);
connectDefaultPluginsToExpress(app, engine);

```

**Note:** `withAccessToken()` has been removed. Access tokens are now handled internally.

## Remove types

Remove all imports from `@unchainedshop/types` and find the types in the according core modules, core and platform.

```diff
- import { Order } from '@unchainedshop/types';
+ import { Order } from '@unchainedshop/core-orders';
```

## Options Rename

```diff
options: {
-  accounts: {
+  users: {
    autoMessagingAfterUserCreation: false
  }
}
```

## Removed Module Functions

`modules.files.getUrl` =>
```ts
const url = await fileUploadAdapter.createDownloadURL(file);
return context.modules.files.normalizeUrl(url, params);
```

`modules.products.prices.userPrice` => `services.products.simulateProductPricing`

`modules.orders.pricingSheet` =>
```ts
import { OrderPricingSheet } from '@unchainedshop/core';
OrderPricingSheet(order);`
```

`modules.orders.positions.pricingSheet` =>
```ts
import { ProductPricingSheet } from '@unchainedshop/core';
ProductPricingSheet({
  ...item,
  currency: order.currency,
});`
```

`modules.orders.delivery.pricingSheet` =>
```ts
import { DeliveryPricingSheet } from '@unchainedshop/core';
DeliveryPricingSheet(delivery);`
```

`modules.orders.payment.pricingSheet` =>
```ts
import { PaymentPricingSheet } from '@unchainedshop/core';
PaymentPricingSheet(payment);`
```

`modules.accounts.findUserByEmail` => `modules.users.findUserByEmail`

`modules.accounts.setUsername` => `modules.users.setUsername`

`modules.accounts.createUser` => `modules.users.createUser` (password does not take a hashed password
anymore, provide plain password here it will hash it on it's own)

`modules.accounts.sendEnrollmentEmail(...)` => `modules.users.sendResetPasswordEmail(..., true);`

`modules.users.delete` => `services.users.deleteUser`

`modules.filters.search.searchProducts` => `services.filters.searchProducts`

`modules.warehousing.estimatedDispatch` => `services.products.simulatedProductDispatching`

`modules.warehousing.estimatedStock` => `services.products.simulatedProductInventory`

`getOrderCart` => `services.orders.findOrInitCart`

`modules.orders.deliveries.activePickUpLocation` =>
```ts
const { orderPickUpLocationId } = orderDelivery.context || {};

const provider = await context.modules.delivery.findProvider({
  deliveryProviderId: orderDelivery.deliveryProviderId,
});
const director = await DeliveryDirector.actions(
  provider,
  { orderDelivery: orderDelivery },
  context,
);

const location = await director.pickUpLocationById(orderPickUpLocationId);
```

`modules.orders.payments.isBlockingOrderConfirmation` =>
```ts
if (orderPayment.status === OrderPaymentStatus.PAID) return false:
const provider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: orderPayment.paymentProviderId,
});
const actions = await PaymentDirector.actions(provider, {}, { modules });
return (!actions.isPayLaterAllowed())
```

`modules.messaging.renderToText` => Directly use literal strings or a templating library, for example [mustache](https://www.npmjs.com/package/mustache) or server-side React.

`modules.orders.checkout` => `services.orders.checkoutOrder`

`modules.ordes.initProviders` => Use `services.orders` methods

## Changed Signatures

### modules.orders.positions.addProductItem

The argument got merged and instead of passing objects you now only need to pass id's.

```ts
const orderPosition = await modules.orders.positions.addProductItem({
    quantity,
    configuration,
    productId: product._id,
    originalProductId: product._id, // or originalProduct._id if available,
    orderId: order._id,
  });
```

Additionally, the module function does not resolve a ConfigurableProduct to the correct SimpleProduct if a configuration is passed. If you need that function, use:
```ts
const product = await modules.products.resolveOrderableProduct(originalProduct, { configuration });
```

## Move away from registerLoginHandlers

Thus the accounts package doesn't exist anymore, if you need custom login, just implement your own mutation and do the checks there and then call `context.login(user)`

The special account events have been migrated too. For account specific topics there is now general events you can subscribe to:

- `USER_UPDATE_PASSWORD`
- `USER_ACCOUNT_ACTION`

## Plugin Presets

The way plugins are connected to Express/Fastify has changed:

```diff
- import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
+ import defaultModules from '@unchainedshop/plugins/presets/all.js';
+ import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
```

For Fastify:
```js
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';
```

## Removed Packages

- `@unchainedshop/types` - Types are now in their respective packages
- `core-accountsjs` - Authentication now uses passport.js
- `core-messaging` - Messaging functionality has been simplified

## New Services Layer

Cross-module functions have been moved to `context.services`:

```ts
// Old way
await modules.orders.checkout(order);

// New way
await services.orders.checkoutOrder(order);
```

Key services available:
- `services.orders.checkoutOrder`
- `services.orders.findOrInitCart`
- `services.users.deleteUser`
- `services.filters.searchProducts`
- `services.products.simulateProductPricing`
- `services.products.simulatedProductDispatching`
- `services.products.simulatedProductInventory`

## User Deletion

User deletion has been improved with better cleanup:

```diff
- removeUser(userId: ID): User!
+ removeUser(userId: ID, removeUserReviews: Boolean): User!
```

New mutation available: `removeUserProductReviews(userId: ID!): Boolean!`

When a user is deleted:
- All related open data is cleaned up
- User tokens are unlinked
- Payment and WebAuthn credentials are deleted
- The user record is marked as deleted (not hard deleted if linked to orders)
