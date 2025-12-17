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

### Locale Context

When creating locale objects for API calls:
```diff
- locale: "de"
+ locale: new Intl.Locale("de")
```

### TokenSurrogate Property Rename

```diff
- token.chainTokenId
+ token.tokenSerialNumber
```

### ProductType Enum Naming Convention

All enum values now use SCREAMING_SNAKE_CASE:
```diff
- ProductType.TokenizedProduct
+ ProductType.TOKENIZED_PRODUCT

- type: "simple" / "configurable" / "bundle" / "plan"
+ type: "SIMPLE" / "CONFIGURABLE" / "BUNDLE" / "PLAN"
```

### Bulk Import

```diff
- import { BulkImportOperation } from '@unchainedshop/platform';
+ import { BulkImportOperation } from '@unchainedshop/core';
+ const handler: BulkImportOperation<unknown> = async (
```

### Login Function on Context

```typescript
// v4: login() is now available directly on context
export default async function loginResolver(_, args, context: Context) {
  const user = await context.modules.users.findUserByEmail(args.email);
  return context.login(user);
}
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

### Plugin Middlewares

Plugin middlewares must now be wrapped in `initPluginMiddlewares`. When combining multiple plugin sets (e.g., base plugins with ticketing), wrap them together:

```diff
- connectBasePluginsToFastify(app);
- connectTicketingToFastify(app);
+ connect(fastify, platform, {
+   initPluginMiddlewares: (app) => {
+     connectBasePluginsToFastify(app);
+     connectTicketingToFastify(app);
+   }
+ });
```

See working example: [ticketing/boot.ts](https://github.com/unchainedshop/unchained/blob/e513c5835da37a01bbd576adcd205a643e841165/examples/ticketing/boot.ts)

### Admin UI

The Admin UI is now packaged and served automatically when installed. Simply install the package and enable it:

```bash
npm install @unchainedshop/admin-ui
```

```typescript
connect(fastify, platform, {
  adminUI: true,
  // ... other options
});
```

See working example: [kitchensink/src/boot.ts](https://github.com/unchainedshop/unchained/blob/e513c5835da37a01bbd576adcd205a643e841165/examples/kitchensink/src/boot.ts)

---

## v2 → v3

### Environment Variables

- Add `UNCHAINED_TOKEN_SECRET` (required)

### Dependencies

```bash
npm install @graphql-yoga/plugin-response-cache graphql-yoga cookie
npm uninstall @apollo/server-plugin-response-cache @apollo/server apollo-graphiql-playground
```

### Peer Dependencies

Some packages are now peer dependencies that must be installed manually:

```bash
# Core peer dependencies
npm install multer passport

# For ticketing/crypto functionality
npm install @scure/bip32 @scure/btc-signer
```

### Boot File Changes (Express)

```diff
- import { startPlatform, withAccessToken, connectPlatformToExpress4 } from '@unchainedshop/platform';
- import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
+ import { startPlatform } from '@unchainedshop/platform';
+ import { connect } from '@unchainedshop/api/express';
+ import defaultModules from '@unchainedshop/plugins/presets/all.js';
+ import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';

- const engine = await startPlatform({ ..., context: withAccessToken() });
- await engine.apolloGraphQLServer.start();
- connectPlatformToExpress4(app, engine, { corsOrigins: [] });
+ const engine = await startPlatform({ modules: defaultModules });
+ connect(app, engine, { initPluginMiddlewares: connectDefaultPluginsToExpress });
```

See working example: [kitchensink/src/boot.ts](https://github.com/unchainedshop/unchained/blob/e513c5835da37a01bbd576adcd205a643e841165/examples/kitchensink/src/boot.ts)

### Boot File Changes (Fastify)

```typescript
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/all-fastify.js';

const fastify = Fastify();

const platform = await startPlatform({ modules: defaultModules });
connect(fastify, platform, { initPluginMiddlewares });
```

### Options Rename

```diff
- options: { accounts: { ... } }
+ options: { users: { ... } }

// Password validation example:
- startPlatform({ accounts: { password: { validateUsername: () => true } } });
+ startPlatform({ options: { users: { validateUsername: async () => true } } });
```

### Types Package Removed

The `@unchainedshop/types` package has been removed. Import types from their respective packages:

| Old Import | New Import |
|------------|------------|
| `@unchainedshop/types/api.js` → `Context` | `@unchainedshop/api` |
| `@unchainedshop/types/common.js` → `ModuleInput` | `@unchainedshop/mongodb` |
| `@unchainedshop/types/common.js` → `TimestampFields` | `@unchainedshop/mongodb` |
| `@unchainedshop/types/user.js` → `User` | `@unchainedshop/core-users` |
| `@unchainedshop/types/orders.js` → `Order`, `OrderPosition` | `@unchainedshop/core-orders` |
| `@unchainedshop/types/products.js` → `Product` | `@unchainedshop/core-products` |
| `@unchainedshop/types/files.js` → `File` | `@unchainedshop/core-files` |
| `@unchainedshop/types/worker.js` → `IWorkerAdapter` | `@unchainedshop/core` |
| `@unchainedshop/types/pricing.js` → pricing types | `@unchainedshop/core` |
| `@unchainedshop/types/filters.js` → `IFilterAdapter`, `FilterContext` | `@unchainedshop/core` |
| `@unchainedshop/types/warehousing.js` → `TokenSurrogate` | `@unchainedshop/core-warehousing` |
| `@unchainedshop/types/events.js` → `OrderStatus` | `@unchainedshop/core-orders` |

**Note:** The `Root` type is no longer exported. Use `unknown` instead in resolver signatures.

### Directors/Adapters Consolidation

All directors and adapters have been moved to `@unchainedshop/core`:

```diff
- import { WorkerDirector } from "@unchainedshop/core-worker";
- import { FilterDirector } from "@unchainedshop/core-filters";
- import { WarehousingDirector } from "@unchainedshop/core-warehousing";
+ import {
+   WorkerDirector,
+   FilterDirector,
+   WarehousingDirector,
+   WarehousingAdapter,
+   IWarehousingAdapter,
+   WarehousingContext,
+   IWorkerAdapter,
+   IFilterAdapter,
+   FilterContext,
+   TemplateResolver,
+   OrderPricingSheet,
+   OrderPricingRowCategory,
+   ProductPricingSheet,
+ } from "@unchainedshop/core";
```

### ACL and Roles Export Changes

```diff
- import { checkAction } from "@unchainedshop/api";
- import { actions } from "@unchainedshop/roles";
+ import { acl, roles } from "@unchainedshop/api";
// Usage: acl.checkAction(), roles.actions
```

### Context API Changes

The `req` object has been removed from context. Use the new `getHeader` method:

```diff
- export default async function myResolver(_, args, context: Context) {
-   const headerValue = context.req.headers["x-custom-header"];
- }
+ export default async function myResolver(_, args, context: Context) {
+   const headerValue = context.getHeader("x-custom-header");
+ }
```

### Accounts Module Merged into Users

```diff
- const user = await modules.accounts.findUserByEmail(email);
- const hash = hashPassword(password); // from @unchainedshop/api
+ const user = await modules.users.findUserByEmail(email);
+ const hash = await modules.users.hashPassword(password);
```

### File URL Method Change

```diff
- const url = modules.files.getUrl(file, params);
+ const url = file?.url && modules.files.normalizeUrl(file.url, params);
```

### Messaging Changes

`modules.messaging.renderToText` has been removed. Use a template library directly:

```diff
- const text = await modules.messaging.renderToText(template, data);
+ // Install mustache: npm install mustache @types/mustache
+ import Mustache from "mustache";
+ const text = Mustache.render(template, data);
```

### Pricing Sheet API Changes

```diff
- const pricing = modules.orders.pricingSheet(order);
- const positionPricing = modules.orders.positions.pricingSheet(orderPosition);
+ import { OrderPricingSheet, ProductPricingSheet } from "@unchainedshop/core";
+
+ const pricing = OrderPricingSheet({
+   calculation: order.calculation,
+   currencyCode: order.currencyCode,
+ });
+
+ const positionPricing = ProductPricingSheet({
+   calculation: orderPosition.calculation,
+   currencyCode: order.currencyCode,
+   quantity: orderPosition.quantity,
+ });
```

**Note:** `OrderPositionPricingSheet` has been renamed to `ProductPricingSheet`.

### Ticketing Package Changes

```diff
- import setupTicketing from "@unchainedshop/ticketing";
- setupTicketing(app, engine.unchainedAPI, { renderOrderPDF, createAppleWalletPass });
+ import setupTicketing, { TicketingAPI, ticketingModules } from "@unchainedshop/ticketing";
+ import connectTicketingToFastify from "@unchainedshop/ticketing/lib/fastify.js";
+ // or for Express:
+ // import connectTicketingToExpress from "@unchainedshop/ticketing/lib/express.js";
+ import ticketingServices from "@unchainedshop/ticketing/lib/services.js";
+
+ const platform = await startPlatform({
+   modules: { ...baseModules, ...ticketingModules },
+   services: { ...ticketingServices },
+ });
+
+ setupTicketing(platform.unchainedAPI as TicketingAPI, {
+   renderOrderPDF,
+   createAppleWalletPass,
+   createGoogleWalletPass,
+ });
+
+ // Connect in your middleware setup
+ connectTicketingToFastify(app);
```

See working example: [ticketing/boot.ts](https://github.com/unchainedshop/unchained/blob/e513c5835da37a01bbd576adcd205a643e841165/examples/ticketing/boot.ts)

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
+ import { OrderPricingSheet } from '@unchainedshop/core';
+ OrderPricingSheet({ calculation: order.calculation, currencyCode: order.currencyCode })

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

---

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Cannot find module '@unchainedshop/types/*'` | Types moved to respective packages (see table above) |
| `Property 'req' does not exist on type 'Context'` | Use `context.getHeader()` instead |
| `Module has no exported member 'checkAction'` | Use `acl.checkAction()` from namespace import |
| `Property 'accounts' does not exist` | Use `modules.users` instead |
| `Cannot find module '@unchainedshop/core-worker'` | Import directors from `@unchainedshop/core` |
| `Cannot find module 'multer'` or `'passport'` | Install peer dependencies: `npm install multer passport` |
| `Property 'pricingSheet' does not exist on modules.orders` | Import `OrderPricingSheet` from `@unchainedshop/core` |
| `hashPassword is not a function` | Use `modules.users.hashPassword()` |
| `Property 'currency' does not exist` (v4) | Renamed to `currencyCode` |
| `ProductType.TokenizedProduct is undefined` (v4) | Use `ProductType.TOKENIZED_PRODUCT` |
