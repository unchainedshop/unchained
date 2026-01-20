# Migration Guide

**Important:** Always upgrade to the latest patch version of each major version before upgrading to the next major version.

---

## v4 → v5 (Breaking Changes)

### Plugin System Modernization

**BREAKING CHANGE:** All deprecated adapter exports and registration methods have been removed. You must use the new unified plugin architecture.

#### Legacy Adapter Exports Removed

All old adapter exports from plugin files have been removed. Use the new `*Plugin` exports instead:

```typescript
// ❌ REMOVED - Old adapter exports
import { Invoice } from '@unchainedshop/plugins/payment/invoice.ts';
import { Stripe } from '@unchainedshop/plugins/payment/stripe/index.js';
import { Post } from '@unchainedshop/plugins/delivery/post.ts';
import { GridFS } from '@unchainedshop/plugins/files/gridfs/index.js';

// ✅ USE - New plugin exports
import { InvoicePlugin } from '@unchainedshop/plugins/payment/invoice.ts';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe/index.js';
import { PostPlugin } from '@unchainedshop/plugins/delivery/post.ts';
import { GridFSPlugin } from '@unchainedshop/plugins/files/gridfs/index.js';
```

#### Director.registerAdapter() Removed

The `registerAdapter()` method on all Directors has been removed. Plugins are now registered via the preset functions or `pluginRegistry`:

```typescript
// ❌ REMOVED
import { PaymentDirector } from '@unchainedshop/core';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe/index.js';
PaymentDirector.registerAdapter(StripePlugin);

// ✅ USE - Register via preset functions
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all.js';
registerAllPlugins(); // Registers all plugins including Stripe

// ✅ OR USE - Direct plugin registry for custom setups
import { pluginRegistry } from '@unchainedshop/core';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe/index.js';
pluginRegistry.register(StripePlugin);
```

**Affected Directors:**
- PaymentDirector
- DeliveryDirector
- FileDirector
- WarehousingDirector
- WorkerDirector
- FilterDirector
- QuotationDirector
- EnrollmentDirector
- ProductPricingDirector
- ProductDiscountDirector
- OrderPricingDirector
- OrderDiscountDirector
- PaymentPricingDirector
- DeliveryPricingDirector

#### Plugin Preset Default Exports Removed

Default exports from preset modules have been removed. Use named registration functions:

```typescript
// ❌ REMOVED
import defaultModules from '@unchainedshop/plugins/presets/base.js';

// ✅ USE - Import named registration function
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base.js';
registerBasePlugins();
```

#### Available Registration Functions

- `registerBasePlugins()` - Essential plugins (from `@unchainedshop/plugins/presets/base.js`)
- `registerAllPlugins()` - All available plugins (from `@unchainedshop/plugins/presets/all.js`)
- `registerCryptoPlugins()` - Cryptocurrency plugins (from `@unchainedshop/plugins/presets/crypto.js`)

### GraphQL API Breaking Changes

#### Deprecated Mutations Removed

The following deprecated mutations have been completely removed. Use the new cart-based mutations instead:

```typescript
// ❌ REMOVED
setOrderDeliveryProvider(orderId: ID!, deliveryProviderId: ID!)
setOrderPaymentProvider(orderId: ID!, paymentProviderId: ID!)
updateOrderDeliveryShipping(orderId: ID!, address: AddressInput, meta: JSON)
updateOrderDeliveryPickUp(orderId: ID!, orderPickUpLocationId: String, meta: JSON)
updateOrderPaymentInvoice(orderId: ID!, paymentContext: JSON, meta: JSON)
updateOrderPaymentGeneric(orderId: ID!, paymentContext: JSON, meta: JSON)
updateOrderPaymentCard(orderId: ID!, paymentContext: JSON, meta: JSON) // Removed in v4

// ✅ USE - New cart mutations
updateCart(orderId: ID!, deliveryProviderId: ID, paymentProviderId: ID, ...)
updateCartDeliveryShipping(orderId: ID!, address: AddressInput, meta: JSON)
updateCartDeliveryPickUp(orderId: ID!, orderPickUpLocationId: String, meta: JSON)
updateCartPaymentInvoice(orderId: ID!, paymentContext: JSON, meta: JSON)
updateCartPaymentGeneric(orderId: ID!, paymentContext: JSON, meta: JSON)
```

#### Deprecated Fields Removed

```typescript
// ❌ REMOVED
OrderDeliveryPickUp.pickUpLocations

// ✅ USE - Access via DeliveryProvider
DeliveryProvider.pickupLocations
```

### API Router Export Changes

Deprecated router aliases have been removed:

```typescript
// ❌ REMOVED
import { expressRouter } from '@unchainedshop/api/express';
import { fastifyRouter } from '@unchainedshop/api/fastify';

// ✅ USE
import { adminUIRouter } from '@unchainedshop/api/express';
import { adminUIRouter } from '@unchainedshop/api/fastify';
```

### PayPal Checkout Plugin Removed

**BREAKING CHANGE:** The PayPal Checkout plugin has been completely removed because the underlying SDK (`@paypal/checkout-server-sdk`) has been deprecated by PayPal.

```typescript
// ❌ REMOVED
import { PaypalCheckoutPlugin } from '@unchainedshop/plugins/payment/paypal-checkout-plugin.ts';
```

**Migration Options:**
- Use Braintree plugin (supports PayPal via Braintree)
- Implement custom PayPal integration using `@paypal/paypal-server-sdk` (new official SDK)
- Use alternative payment providers

### PluginRegistry Internal Changes

**BREAKING CHANGE:** `PluginRegistry.registerAdapters()` method removed (was a no-op).

If you were calling this method, simply remove it. Adapters are now registered via `pluginRegistry.register()` or preset functions.

---

## v3 → v4

### Environment Variables

- Add `UNCHAINED_DOCUMENTDB_COMPAT_MODE` for FerretDB/AWS/Azure DocumentDB compatibility
- **Breaking:** `UNCHAINED_TOKEN_SECRET` now requires a minimum of 32 characters. Update your secret if it was shorter in previous versions

### Peer Dependencies

When using the Express adapter (`@unchainedshop/api/express`), ensure you have the correct peer dependency versions:

```bash
npm install multer@">=2 <3" passport@">=0.7 <1" passport-strategy
```

For ticketing/crypto functionality:

```bash
npm install @scure/bip32@">=2" @scure/btc-signer@">=2"
```

### Custom Migrations

Migration IDs must now be between `19700000000000` and `99999999999999` (14 digits max). If you have existing migrations with 15-digit IDs (e.g., `202409302329000`), you'll need to update them.

**Recommended format:** `YYYYMMDDHHmmss` (e.g., `20240930232900`)

### MongoDB Driver Changes

The MongoDB driver now throws errors instead of returning error objects for certain operations:

```diff
// Collection.dropIndex() now throws when index doesn't exist
- const result = collection.dropIndex('my_index');
- if (result.errmsg) { /* handle error */ }
+ try {
+   await collection.dropIndex('my_index');
+ } catch (error) {
+   // Handle missing index error
+ }
```

**Note:** Ensure you `await` async operations to properly catch errors.

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

### User Creation

`modules.users.createUser` now accepts a plain password instead of a pre-hashed password:

```diff
- const hashedPassword = await modules.users.hashPassword(plainPassword);
- const user = await modules.users.createUser({ email, password: hashedPassword });
+ const user = await modules.users.createUser({ email, password: plainPassword });
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
# Required when using Express adapter (@unchainedshop/api/express)
npm install multer passport passport-strategy

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
| `Cannot find module 'multer'` or `'passport'` | Install peer dependencies: `npm install multer@">=2 <3" passport@">=0.7 <1"` |
| `Property 'pricingSheet' does not exist on modules.orders` | Import `OrderPricingSheet` from `@unchainedshop/core` |
| `hashPassword is not a function` | Use `modules.users.hashPassword()` |
| `Property 'currency' does not exist` (v4) | Renamed to `currencyCode` |
| `ProductType.TokenizedProduct is undefined` (v4) | Use `ProductType.TOKENIZED_PRODUCT` |
| `PASSWORD_INVALID` when using `createUser` (v4) | Pass plaintext password, not pre-hashed. The module hashes internally now |
| `UNCHAINED_TOKEN_SECRET` validation error (v4) | Secret must be at least 32 characters |
| Migration ID validation error (v4) | Use 14-digit IDs max (format: `YYYYMMDDHHmmss`) |
| `dropIndex` not catching errors | Use `await` and try/catch - MongoDB driver now throws instead of returning error objects |

---

## v1 → v2

### Node.js Requirements

WHATWG Fetch support required. Update Node to 18+ or enable Experimental Fetch support on Node.js 16+.

### Dependencies

```bash
npm install graphql@16
npm uninstall apollo-server-express body-parser graphql-scalars graphql-upload isomorphic-unfetch locale simpl-schema
```

### Boot File Changes

Remove custom login-with-single-sign-on and all code that involves loading standard plugins and/or gridfs/datatrans webhooks.

`startPlatform` no longer hooks into Express or starts the GraphQL server automatically. This change supports other backend frameworks and Lambda Mode.

```typescript
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import { connect } from '@unchainedshop/api/express/index.js';

const engine = await startPlatform({ modules: defaultModules, /* ... */ });

await engine.apolloGraphQLServer.start();
connect(app, engine);
connectDefaultPluginsToExpress4(app, engine);
```

### Database Fields

The `userId` parameters used to set internal db fields (`updatedBy` / `createdBy`) have been removed from various functions. This will likely affect seed code. TypeScript will help identify affected locations.

### API Changes

Examine the API Breaking Changes in the Changelog for incompatibilities between 1.2 and 2.0.
