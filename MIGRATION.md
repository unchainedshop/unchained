# Migration Guide

**Important:** Always upgrade to the latest patch version of each major version before upgrading to the next major version.

---

## v3 → v4

### Environment Variables

- Add `UNCHAINED_DOCUMENTDB_COMPAT_MODE` for FerretDB/AWS/Azure DocumentDB compatibility

### Currency & Country Renames

```diff
- context.currencyContext / countryContext / localeContext
+ context.currencyCode / countryCode / locale

- Price.currency / Order.currency
+ Price.currencyCode / Order.currencyCode

- simulatedPrice(currency: ...) / catalogPrice(currency: ...)
+ simulatedPrice(currencyCode: ...) / catalogPrice(currencyCode: ...)
```

Update custom pricing plugins:
```diff
- ProductPricingSheet({ calculation, currency, quantity })
+ ProductPricingSheet({ calculation, currencyCode, quantity })
```

### Bulk Import

```diff
- import { BulkImportOperation } from '@unchainedshop/platform';
+ import { BulkImportOperation } from '@unchainedshop/core';
+ const handler: BulkImportOperation<unknown> = async (
```

### Product Types

```diff
- type: "simple" / "configurable" / "bundle" / "plan"
+ type: "SIMPLE" / "CONFIGURABLE" / "BUNDLE" / "PLAN"
```

### Mutations

Removed: `updateOrderPaymentCard`

Deprecated (use new cart mutations instead):
```diff
- setOrderDeliveryProvider / setOrderPaymentProvider
- updateOrderDeliveryShipping / updateOrderDeliveryPickUp
- updateOrderPaymentInvoice / updateOrderPaymentGeneric
+ updateCartDeliveryShipping / updateCartDeliveryPickUp
+ updateCartPaymentInvoice / updateCartPaymentGeneric
```

### Queries

```diff
- events(created: DateTime) / eventsCount(created: DateTime)
+ events(created: DateFilterInput) / eventsCount(created: DateFilterInput)

- deliveryInterfaces(type: DeliveryProviderType!)
+ deliveryInterfaces(type: DeliveryProviderType)  # type now optional
```

New filters: `Query.orders` accepts `paymentProviderIds`, `deliveryProviderIds`, `dateRange`; `Query.users` accepts `tags`

### Work Queue

```diff
- workQueueOptions: { retryInput: ... }
+ workQueueOptions: { transformRetry: ... }
```

### Plugins

- Twilio: `SMS` → `TWILIO`
- Payment plugins: `paymentProviderId` removed from adapter context
- MCP/AI packages now optional peer dependencies

---

## v2 → v3

### Environment Variables

- Add `UNCHAINED_TOKEN_SECRET` (required)

### Dependencies

```bash
npm install @graphql-yoga/plugin-response-cache graphql-yoga cookie
npm uninstall @apollo/server-plugin-response-cache @apollo/server apollo-graphiql-playground
```

### Boot File Changes

```diff
- import { startPlatform, withAccessToken, connectPlatformToExpress4 } from '@unchainedshop/platform';
- import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
+ import { startPlatform, setAccessToken } from '@unchainedshop/platform';
+ import { connect } from '@unchainedshop/api/lib/express/index.js';
+ import defaultModules from '@unchainedshop/plugins/presets/all.js';
+ import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';

- const engine = await startPlatform({ ..., context: withAccessToken() });
- await engine.apolloGraphQLServer.start();
- connectPlatformToExpress4(app, engine, { corsOrigins: [] });
+ const engine = await startPlatform({ options: { users: { ... } } });
+ connect(app, engine);
+ connectDefaultPluginsToExpress(app, engine);
```

### Options Rename

```diff
- options: { accounts: { ... } }
+ options: { users: { ... } }
```

### Types Package Removed

```diff
- import { Order } from '@unchainedshop/types';
+ import { Order } from '@unchainedshop/core-orders';
```

### Authentication Mutations Removed

- `loginWithOAuth`, `linkOAuthAccount`, `unlinkOAuthAccount`
- `logoutAllSessions`
- `buildSecretTOTPAuthURL`, `enableTOTP`, `disableTOTP`
- `updateUserAvatar`, `addProductMedia`, `addAssortmentMedia` (use PUT upload)

### LoginMethodResponse Changed

```diff
- { id: String!, token: String!, tokenExpires, user }
+ { _id: String!, tokenExpires, user }  # Use cookies/access-keys for auth
```

### Password Parameters Renamed

```diff
- plainPassword / newPlainPassword / oldPlainPassword / totpCode
+ password / newPassword / oldPassword (totpCode removed)
```

### Create Mutations

```diff
- createProduct(product: { title: "...", type: "..." })
+ createProduct(product: { type: "..." }, texts: [{ locale: "en", title: "..." }])
```

Same pattern for: `createProductVariation`, `createProductVariationOption`, `createAssortment`, `createFilter`, `createFilterOption`

### Input Type Renames

- `UpdateProductTextInput` → `ProductTextInput`
- `UpdateAssortmentTextInput` → `AssortmentTextInput`
- `UpdateFilterTextInput` → `FilterTextInput`
- All `locale` fields: `String` → `Locale`

### Removed Fields

- `Price._id`, `Stock._id`, `Dispatch._id`, `PriceRange._id`
- `User.isTwoFactorEnabled`, `User.oAuthAccounts`
- `Shop.oAuthProviders`

### Module Functions → Services

```diff
- modules.orders.checkout(order)
+ services.orders.checkoutOrder(order)

- modules.orders.pricingSheet(order)
+ import { OrderPricingSheet } from '@unchainedshop/core'; OrderPricingSheet(order)

- modules.accounts.findUserByEmail / setUsername / createUser
+ modules.users.findUserByEmail / setUsername / createUser

- modules.users.delete
+ services.users.deleteUser

- modules.filters.search.searchProducts
+ services.filters.searchProducts

- getOrderCart
+ services.orders.findOrInitCart
```

### Other Changes

- `addMultipleCartProducts` returns `Order!` instead of `[OrderItem]!`
- `removeUser(userId, removeUserReviews)` has new optional parameter
- Cart totals return `null` when cart is empty
- Custom login: use `context.login(user)` instead of `registerLoginHandlers`
- Account events: `USER_UPDATE_PASSWORD`, `USER_ACCOUNT_ACTION`
