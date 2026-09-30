# Migration Guide

**Important:** Always upgrade to the latest patch version of each major version before upgrading to the next major version.

---

## v4.8.x MCP: SDK v2, stateless `/mcp`

The MCP integration migrated from the monolithic MCP TypeScript SDK v1 to the split v2 SDK. The optional peer dependency was **renamed**: `@modelcontextprotocol/sdk` is no longer supported.

**If you have MCP enabled**, swap the peer (this shrinks the installed MCP footprint from ~94 transitive packages to 3):

```bash
npm uninstall @modelcontextprotocol/sdk
npm install @modelcontextprotocol/server
```

**If you have chat enabled**, the chat handlers no longer import any `@modelcontextprotocol/*` client package — the shop-configuration resources are read in-process. Chat deployments need `ai` and `@ai-sdk/mcp` (unchanged) **and** `@modelcontextprotocol/server`, because the chat tools are still derived through the engine's own `/mcp` endpoint. The engine still boots without any of these packages installed; `/mcp` then answers `503` and logs a warning naming the missing package instead of failing.

**Wire-behavior changes** (all spec-conformant; MCP Inspector, `@ai-sdk/mcp` and other current clients handle them transparently):

- `/mcp` is now **stateless**: every request is served by a fresh, per-request MCP server built from that request's authenticated context. No `Mcp-Session-Id` is issued or required, and the endpoint is safe behind load balancers and in multi-replica deployments.
- `/mcp` validates `Host` and browser `Origin` headers against the hostname in `ROOT_URL` (plus localhost aliases) before SDK dispatch. Set `ROOT_URL` to the public engine URL and configure reverse proxies to preserve the external `Host` header.
- `GET /mcp` (standalone SSE stream) and `DELETE /mcp` (session termination) now return `405`. The engine never used server-initiated notifications, so no capability is lost.
- Clients speaking the modern MCP protocol era (revision 2026-07-28, `server/discover`) are now supported in addition to the legacy `initialize` handshake era.
- Tool input schemas in `tools/list` now declare JSON Schema draft 2020-12 instead of draft-07; the schema content itself (properties, enums, descriptions, required fields) is unchanged.

Auth is unchanged: every request passes the same 401/403 admin wall as before (including the `WWW-Authenticate` / `.well-known/oauth-protected-resource` metadata used by OAuth setups).

The `zod` dependency range of `@unchainedshop/api` and `@unchainedshop/core` narrowed from `^3.25.76 || ^4` to `^4.2.0` (both packages only ever used the zod-4 API).

## v4.8.x DocumentDB Compatibility Mode Removed

`UNCHAINED_DOCUMENTDB_COMPAT_MODE` is no longer read. The helpers `isDocumentDBCompatModeEnabled` and `assertDocumentDBCompatMode` have been deleted from `@unchainedshop/mongodb`. Text indexes are now created unconditionally on every collection and `$text` queries run unconditionally. **If you still target AWS DocumentDB ≤4.0 or FerretDB 1.x, do not upgrade** — those runtimes do not support text indexes and startup will fail. Supported text-search targets now:

| Runtime | Text indexes | Since |
|---|---|---|
| MongoDB 4.4+ | ✅ | 2.6 |
| AWS DocumentDB 5.0+ | ✅ | Feb 2024 |
| AWS DocumentDB 8.0 | ✅ (Text Index V2) | 2026 |
| FerretDB 2.x | ✅ | 2.0 GA |
| AWS DocumentDB ≤4.0 | ❌ | not supported |
| FerretDB 1.x | ❌ | not supported |

Remove `UNCHAINED_DOCUMENTDB_COMPAT_MODE` from your deployment env. Any downstream code importing `isDocumentDBCompatModeEnabled` or `assertDocumentDBCompatMode` from `@unchainedshop/mongodb` must be deleted — there is no replacement.

## v4.8.x Index Refactor (Ops Migration)

This release refactors MongoDB indexes across every collection: compound indexes replace several singletons, new indexes cover previously unindexed hot paths, and a few unused indexes are removed. All *new* indexes are built automatically on boot via `buildDbIndexes`. However, **MongoDB does not drop removed indexes automatically** — they remain on existing production databases until explicitly dropped, consuming RAM and slowing writes.

Run the following `mongosh` script once per environment after deploying:

```js
// Old singletons now covered by compound indexes — safe to drop.
const toDrop = {
  orders:              ['deleted_1', 'userId_1', 'status_1'],
  order_positions:     ['productId_1_1'], // if exists under that exact name
  order_discounts:     ['trigger_1'],
  quotations:          ['userId_1', 'productId_1', 'status_1'],
  enrollments:         ['userId_1', 'productId_1', 'status_1'],
  products:            ['deleted_1', 'sequence_1', 'status_1'],
  product_texts:       ['locale_1'],
  product_variation_texts: ['locale_1'],
  product_media_texts: ['locale_1'],
  assortments:         ['deleted_1', 'isActive_1', 'isRoot_1', 'sequence_1'],
  assortment_texts:    ['locale_1'],
  assortment_media_texts: ['locale_1'],
  work_queue:          ['started_-1', 'scheduled_1', 'priority_-1', 'type_1'],
  payment_credentials: ['userId_1'],
  'payment-providers':      ['type_1', 'created_1', 'deleted_1'],
  'delivery-providers':     ['type_1', 'created_1', 'deleted_1'],
  'warehousing-providers':  ['type_1', 'created_1', 'deleted_1'],
  filter_productId_cache: ['filterId_1'],
};

for (const [coll, names] of Object.entries(toDrop)) {
  const existing = new Set(db.getCollection(coll).getIndexes().map(i => i.name));
  for (const name of names) {
    if (existing.has(name)) {
      print(`Dropping ${coll}.${name}`);
      db.getCollection(coll).dropIndex(name);
    }
  }
}
```

Run `db.<collection>.getIndexes()` to verify the actual index names in your deployment — MongoDB's auto-generated names follow the `field_direction` pattern (e.g. `userId_1`, `started_-1`), but partial indexes or custom names may differ. If a listed index doesn't exist, `dropIndex` will throw; the script above guards with a name-set check. Skipping this step is safe — the old indexes will simply continue to consume resources until you clean them up.

### Breaking: cryptopay plugin is now async

If you wire the cryptopay plugin directly, `configureCryptopayModule` is now `async`:

```typescript
// ❌ Before
const cryptopay = configureCryptopayModule({ db });

// ✅ After
const cryptopay = await configureCryptopayModule({ db });
```

### Breaking: warehousing.buildAccessKeyForToken renamed

`modules.warehousing.buildAccessKeyForToken(tokenId: string)` is now `modules.warehousing.buildAccessKeyFromToken(token: TokenSurrogate)` and returns `Promise<string>` (no longer nullable). Callers must pass the full token object.

### Breaking: Payrexx env vars renamed

`DATATRANS_SUCCESS_PATH`, `DATATRANS_ERROR_PATH`, `DATATRANS_CANCEL_PATH` → `PAYREXX_SUCCESS_PATH`, `PAYREXX_ERROR_PATH`, `PAYREXX_CANCEL_PATH`.

### Saferpay env vars renamed

`SAFERPAY_USER`, `SAFERPAY_PW` → `SAFERPAY_API_USER`, `SAFERPAY_API_PASSWORD`. The old names are still read as deprecated fallbacks, but the new names take precedence — if you ever set placeholder `SAFERPAY_API_*` values (early v5 alphas required them to pass the boot guard), remove them or set the real credentials there, otherwise the placeholders now win. Plugin registration additionally requires `SAFERPAY_CUSTOMER_ID` and `SAFERPAY_TERMINAL_ID`; without valid credentials the plugin's adapter and webhook route are skipped at boot (a warning is logged).

### Breaking: Stripe API + SDK version

Stripe SDK peer range widened from `>=19 <21` to `>=19 <23`. The plugin now uses Stripe API version `2026-03-25.dahlia`. Upgrade your installed `stripe` package to v22 to match the devDependency.

### Breaking: Web3Address.nonce scalar

`Web3Address.nonce` GraphQL scalar changed from `Int` to `String`. Update any client codegen and forms.

---

## v4 → v5 (Breaking Changes)

### Node.js 26 required

Upgrade to Node.js 26 or newer before running v5. Use `nvm install && nvm use` in this repository to select the version in `.nvmrc`. Package engine requirements, examples, Docker images, and CI use Node.js 26.

### Index Conflicts on v4.8-era Databases (Ops Note)

Some indexes changed shape without changing name (e.g. `orders.orderNumber_1` and `products.warehousing.sku_1` are now `sparse`). On databases created by v4.8, boot logs `MongoServerError: An existing index has the same name as the requested index` for these — the engine continues and the old index stays in place. To adopt the new index shape, drop the conflicting index once (`db.orders.dropIndex('orderNumber_1')`, `db.products.dropIndex('warehousing.sku_1')`) and restart; `buildDbIndexes` recreates them.

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
import { InvoicePlugin } from '@unchainedshop/plugins/payment/invoice';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe';
import { PostPlugin } from '@unchainedshop/plugins/delivery/post';
import { GridFSPlugin } from '@unchainedshop/plugins/files/gridfs';
```

#### Director.registerAdapter() Removed

The `registerAdapter()` method on all Directors has been removed. Plugins are now registered via the preset functions or `pluginRegistry`:

```typescript
// ❌ REMOVED
import { PaymentDirector } from '@unchainedshop/core';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe/index.js';
PaymentDirector.registerAdapter(StripePlugin);

// ✅ USE - Register via preset functions
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';
registerAllPlugins(); // Registers all plugins including Stripe

// ✅ OR USE - Direct plugin registry for custom setups
import { pluginRegistry } from '@unchainedshop/core';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe';
pluginRegistry.register(StripePlugin);
```

Note: import plugin subpaths WITHOUT a file extension. The package `exports` map (e.g. `"./presets/*": "./lib/presets/*.js"`) appends `.js` itself, so `presets/all.js` would resolve to `all.js.js` and fail.

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

Default exports from the presets have been removed. Use the named registration functions:

```typescript
// ❌ REMOVED
import defaultModules from '@unchainedshop/plugins/presets/base.js';

// ✅ USE - Import named registration function
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
registerBasePlugins();
```

#### Available Registration Functions

- `registerBasePlugins()` - Essential plugins (from `@unchainedshop/plugins/presets/base`)
- `registerAllPlugins()` - All available plugins (from `@unchainedshop/plugins/presets/all`)
- `registerCryptoPlugins()` - Cryptocurrency plugins (from `@unchainedshop/plugins/presets/crypto`)

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

The Braintree plugin was also dropped in v5 (it only exists on the v4.8.x branch), so it is not a migration target.

**Migration Options:**
- Implement a custom PayPal integration using `@paypal/paypal-server-sdk` (new official SDK) via `registerPaymentProvider()`
- Use alternative payment providers (Stripe, Datatrans, Saferpay, Payrexx, PostFinance Checkout)

### PluginRegistry Internal Changes

**BREAKING CHANGE:** `PluginRegistry.registerAdapters()` method removed (was a no-op).

If you were calling this method, simply remove it. Adapters are now registered via `pluginRegistry.register()` or preset functions.

### Plugin Authoring Factories (new, recommended)

Custom adapters can now be registered with a single typed call instead of a hand-built `IPlugin`. The factories are re-exported from `@unchainedshop/core` (`registerPaymentProvider`, `registerDeliveryProvider`, `registerProductPricing`, `registerOrderDiscount`, `registerWorker`, `registerFileAdapter`, `registerQuotation`, `registerEnrollment`, …). `pluginRegistry.register()` with a hand-built `IPlugin` remains the low-level path for custom keys/versions, routes, modules or lifecycle hooks. See the [Plugin Factories](https://docs.unchained.shop/extend/plugin-factories) documentation.

### Leveled Pricing: `maxQuantity` → `minQuantity`

**BREAKING CHANGE (with automatic data migration).** Product catalog price tiers are now keyed by **`minQuantity`** — an inclusive *lower* bound — instead of v4's `maxQuantity` (inclusive *upper* bound). The base tier is `minQuantity: 0` and the highest tier is open-ended (no upper cap).

- **GraphQL:** `UpdateProductCommercePricingInput.maxQuantity` is removed — use `minQuantity` (omit it for the base tier). `PriceLevel.minQuantity` is added; `PriceLevel.maxQuantity` is now derived (the next tier's floor − 1; `null` on the open-ended tier). `ProductCatalogPrice.minQuantity` replaces `maxQuantity`.
- **Data:** an idempotent startup migration (`20260611120000-pricing-maxquantity-to-minquantity`) converts existing `commerce.pricing` per `(countryCode, currencyCode)` automatically. **No operator action is required** and re-running is safe.
- **Action for integrators:** update any storefront query, client codegen, or bulk-import/export payload that wrote `maxQuantity` to write `minQuantity`.

```jsonc
// commerce.pricing — before (v4)            // after (v5, auto-migrated)
[                                            [
  { "amount": 1000, "maxQuantity": 4 },        { "amount": 1000, "minQuantity": 0 },
  { "amount": 900,  "maxQuantity": 9 },        { "amount": 900,  "minQuantity": 5 },
  { "amount": 800 }  /* open-ended top */      { "amount": 800,  "minQuantity": 10 }
]                                            ]
```

### Order calculations: gross → net category balances

Order category balances (`ITEMS`, `DELIVERY`, `PAYMENT`, `DISCOUNTS`) now exclude tax.
Separate `TAXES` rows contribute to the gross total, as they already do in product,
delivery and payment pricing sheets.

The automatic startup migration `20260907120000-order-calculation-net` converts all
persisted order calculations, including carts and completed or rejected orders.
It retains the original rows and adds offsets using their recorded tax amounts.
Where floating-point cancellation would change a historical balance, it adds a
precision adjustment with migration metadata. Adjustments for the whole order or
a discount spanning categories use `ROUNDING` (prefixed with `_` if that category
already exists). These are ordinary additive rows; no legacy runtime reader is
needed. The migration does not rerun pricing adapters, look up current rates, round
recorded amounts or change order timestamps. It verifies historical gross/net
balances and rounded discount amounts before writing each order, including prices
on half-cent boundaries.
Already marked net calculations are skipped, and each order is updated atomically
so interrupted runs can safely resume. Item, delivery and payment calculations
already have the required representation and are left intact.

Migrations run only on instances with workers enabled (`disableWorker` and
`UNCHAINED_DISABLE_WORKER` skip them), after plugins and API setup and before the
queue managers start. A failed migration is logged and stops the remaining
migrations, but it does not stop startup; the next start resumes after the last
completed migration. Tax rows without `baseCategory` are attributed to their
preceding category row (the built-in adapters' historical layout); an unresolvable
tax row stops the migration with the order ID so its attribution can be repaired.
Invalid amounts or contradictory historical discount views also stop it without
rewriting that order. Successful conversions remain safe to resume.

Until this migration has completed, the new release reads orders that were not
converted yet as net and shows wrong totals. Upgrade in this order:

1. Stop all older application instances: they must not write gross order
   calculations after the migration.
2. Start one instance with workers enabled and wait for the migration: the
   `last-migration` collection contains a document with `_id: 20260907120000`
   (category `unchained`), and the log shows `Migrated 'up' to 20260907120000`.
3. Only then start or scale up instances that run with workers disabled.
4. Treat `Migration failed; continuing startup` in the log as a release blocker:
   repair the reported order and restart a worker-enabled instance to resume.

Restore a database backup before rolling back to a release that expects gross order
rows. Custom integrations using `initCore` directly must run the registered
migrations before serving requests.

Custom order pricing adapters must pass **net** `amount` values and the separate
`taxAmount` to `addItems`, `addDelivery`, `addPayment` and `addDiscount`. For example,
a gross price of 10,000 with 715 tax becomes `{ amount: 9285, taxAmount: 715 }`.
Public `gross()`, `net()`, `total()` and discount breakdowns retain their price
semantics; the runtime no longer infers legacy formats.

Consumers must sum category balances through the pricing sheet instead of reading
the first row: migrated calculations retain their original rows and add offsets.
MCP sales summaries, monthly reports and customer-spending statistics use gross
item balances for both migrated and newly calculated orders.

### Events: explicit emit-adapter registration

**BREAKING CHANGE for Redis / AWS EventBridge users.** These transports no longer self-register as a side effect of being imported. Register the emit adapter explicitly before `startPlatform`:

```ts
// ❌ Before: importing the module had the side effect of registering it
import '@unchainedshop/plugins/events/redis';

// ✅ After: register explicitly
import { setEmitAdapter } from '@unchainedshop/events';
import { RedisEventEmitter } from '@unchainedshop/plugins/events/redis';
setEmitAdapter(RedisEventEmitter());
```

The Node.js in-memory emitter is still wired automatically by `registerBasePlugins()`. `EmitAdapter` also gained an optional `shutdown()` (the redis/eventbridge adapters implement it to close connections; `startPlatform` calls it on graceful shutdown).

### Server wiring: `connect()` and plugin routes

`connect()` is async and no longer takes `initPluginMiddlewares`. HTTP routes of registered plugins (payment webhooks, file uploads, the ERC metadata route, ticketing) are mounted by `connect()` itself, before the Admin UI. The framework route presets (`presets/base-fastify.js`, `presets/all-express.js`, …) and the per-plugin `handler-express` / `handler-fastify` files are gone.

```ts
// ❌ v4
connect(fastify, platform, {
  adminUI: true,
  initPluginMiddlewares: (app) => {
    connectBasePluginsToFastify(app);
    connectTicketingToFastify(app);
  },
});
fastify.route({ url: '/payment/payrexx', method: 'POST', handler: payrexxHandler });

// ✅ v5
registerBasePlugins(); // or pluginRegistry.register(PayrexxPlugin), … before startPlatform
const platform = await startPlatform({});
await connect(fastify, platform, { adminUI: true });
```

Remove routes you mounted by hand for built-in plugins (they would be registered twice). On Express, `connect()` mounts the Admin UI with a catch-all `GET` route last: `GET` routes you add after `connect()` are only reached when the Admin UI is disabled. Ship your own routes as `routes` of an `IPlugin` (see [Plugin Factories](https://docs.unchained.shop/extend/plugin-factories)) or mount them before `connect()`.

Sessions are stateless JWTs that expire after `UNCHAINED_TOKEN_EXPIRY_SECONDS` (default `3600`) and are not renewed while in use; v4 sessions lasted 7 days. Long shifts (for example gate staff) need a higher value or a new login; the value applies to all users.

### Tokenized products and the ERC metadata route

- `UpdateProductTokenizationInput.contractAddress` and `tokenId` are optional; off-chain tokens (tickets) no longer need `0x0` / `0` placeholders. `updateProductTokenization` (and the MCP product tool) replace the tokenization as a whole, like the other product configurations.
- `ContractConfiguration.tokenId` is nullable, and `ProductTokenization.contractAddress` / `tokenId` are optional in TypeScript. Regenerate typed clients.
- The public ERC metadata route (`/erc-metadata/:productId/[:locale/]:serial.json`) looks tokens up by product and serial number for ERC-721 and ERC-1155 alike, matches the serial case-sensitively, answers `404` for unknown or non-tokenized products and serves only the EIP metadata keys (`name`, `description`, `image`, `properties`, `attributes`, `localization`, `external_url`, `animation_url`, `background_color`, `decimals`). ERC-721 URLs that used the product's `tokenId` instead of the token serial now answer `404`.
- With several active `VIRTUAL` warehousing providers, the first one (oldest) decides alone whether a token can be invalidated and what its metadata is; a later provider can no longer override its answer.
- Bulk import: product `CREATE` / `UPDATE` payloads declare `specification.tokenization` (`contractAddress`, `contractStandard`, `tokenId`, `supply`, `ercMetadataProperties`) and accept `published` as a date or a date string.

### ETH minter is web3-only

The ETH minter (`shop.unchained.warehousing.infinite-minter`) knows nothing about events: no entry window around `ercMetadataProperties.slot` (a token can be invalidated until it is invalidated), cancelled tokens count against the supply, and tokens carry no `meta.orderId`. Event tickets use the ticket issuer of `@unchainedshop/ticketing` ([Ticketing](#ticketing-unchainedshopticketing)), which has those rules. Changes against v4:

- `token.meta` is no longer part of the ERC metadata; the public route serves only the EIP keys (see above). Code that read `Token.ercMetadata.orderId` reads `Token.order { _id orderNumber }` instead (the order the token was issued for, `null` when the viewer may not view it), as the Admin UI token list does.
- `localization.uri` contains the `{locale}` placeholder wallets substitute and the token serial, and honours `ERC_METADATA_API_PATH`.
- Stock counts the issued tokens of the product (of its `tokenId` for ERC-1155). Before, the lookup never matched, so tokenized products never sold out and ERC-721 serials started at 1 again for every order.

### Ticketing (`@unchainedshop/ticketing`)

The ticketing package is a plugin now, adds a GraphQL API and an Admin UI plugin, and ships its own ticket issuer. The [Event Ticketing guide](https://docs.unchained.shop/guides/ticketing-setup) describes the result, the [Ticket Renderers guide](https://docs.unchained.shop/guides/ticketing-renderers) the renderers. Go through these steps:

**1. Boot.** `setupTicketing` (the default export), `setupPDFTickets`, `setupMobileTickets` and the connectors `@unchainedshop/ticketing/lib/express.js` / `lib/fastify.js` are removed.

```ts
// ❌ v4
import setupTicketing, { ticketingModules, ticketingServices } from '@unchainedshop/ticketing';
import connectTicketingToFastify from '@unchainedshop/ticketing/lib/fastify.js';

const platform = await startPlatform({
  modules: { ...baseModules, ...ticketingModules },
  services: { ...ticketingServices },
});
connect(fastify, platform, { initPluginMiddlewares: (app) => connectTicketingToFastify(app) });
setupTicketing(platform.unchainedAPI, { renderOrderPDF, createAppleWalletPass, createGoogleWalletPass });

// ✅ v5
import { pluginRegistry } from '@unchainedshop/core';
import { createTicketingPlugin, validateTicketOrderPosition, withTicketing } from '@unchainedshop/ticketing';
import { createTicketWarehousingPlugin } from '@unchainedshop/ticketing/warehousing/ticket';
import { ticketingAdminPlugin } from '@unchainedshop/ticketing/admin-plugin';

pluginRegistry.register(createTicketingPlugin({ renderOrderPDF, createAppleWalletPass, createGoogleWalletPass }));
pluginRegistry.register(createTicketWarehousingPlugin({ ticketMeta })); // replaces your ticket minter, see 6
const platform = await startPlatform(
  withTicketing({ options: { orders: { validateOrderPosition: validateTicketOrderPosition } } }),
);
await connect(fastify, platform, { adminUI: { plugins: [ticketingAdminPlugin()] } });
```

Do not pass `ticketingModules` any more; the plugin provides the `passes` module. `UNCHAINED_SECRET` is still required; without it the engine does not start (`TICKETING_SECRET_MISSING`). The ticketing route paths are read when `createTicketingPlugin()` is called, and a missing `@parse/node-apn` is reported when the first Apple pass update is pushed instead of at startup.

**2. Custom GraphQL schema.** A `schema` passed to `startPlatform` makes the server ignore `typeDefs` and `resolvers`, so the ticketing API would silently be missing. Add `ticketingTypeDefs` and `ticketingResolvers` to your own schema, and build it after `startPlatform` from `Object.keys(roles.actions)` (the `RoleAction` enum needs `scanTicket`, `gateControl` and `cancelTicket`, or `User.allowedActions` fails for admins and staff); see [Custom GraphQL schema](https://docs.unchained.shop/guides/ticketing-setup#custom-graphql-schema). A list of `actions` you copied from `roles.actions` at import time does not contain them.

Delete your own `cancelEvent`, `cancelTicket` and `isCanceled` definitions and resolvers, and your own `TokenizedProduct.event` or `TicketEvent` if you had one. `Mutation.cancelEvent` returns `Int!` (a `Boolean` definition cannot be merged), `TokenizedProduct.isCanceled` moved to `TokenizedProduct.event.isCanceled`, and resolvers listed later silently replace ticketing's. The mutations require the `cancelTicket` action (administrators by default); grant it to the roles that cancelled through `viewUsers`, `viewTokens` or `updateToken` before.

**3. Cancellation service and e-mails.**

```diff
- services.ticketing.cancelTicketsForProduct(productId): Promise<number>
+ services.ticketing.cancelTicketsForProduct(productId, { generateDiscount, countryCode, currencyCode }?): Promise<{ cancelledCount }>
+ services.ticketing.cancelTicketWithDiscount(tokenId, { generateDiscount, countryCode, currencyCode, refuseRedeemed }?)
```

Both set `meta.cancelled` and `meta.cancelledDate` before they invalidate a ticket, emit `TICKET_CANCELLED` per ticket and queue the `TICKET_CANCELLED` / `EVENT_CANCELLED` e-mails; `cancelTicketsForProduct` also marks the event (`product.meta.cancelled`, `meta.cancelledDate`) and emits `TICKET_EVENT_CANCELLED`. A kept project mutation that checks `if (!cancelled)` on the returned object never stops, and one that sends its own e-mails sends them twice.

`cancelTicketWithDiscount` still cancels redeemed tickets by default. With `refuseRedeemed` (the `cancelTicket` mutation sets it) it throws an `Error` with `cause: 'TICKET_ALREADY_REDEEMED'` for a redeemed ticket, also when a scan redeems it while the cancellation runs, before any e-mail is queued or event emitted; if another cancellation wins, it returns that ticket without reimbursing again. `scanTicket` in turn refuses a ticket cancelled while it is scanned, so a ticket is not both admitted and reimbursed.

`TOKEN_INVALIDATED` handlers that must not react to cancellations (for example badge printing) can now check `token.meta.cancelled`, or subscribe to `TICKET_REDEEMED` instead, which only `scanTicket` emits.

**4. E-mail templates.** Ticketing registers `EVENT_CANCELLED` and `TICKET_CANCELLED` only if you have not: your templates win in any registration order. The template input is `{ productId | tokenId, userId, discountCode?, discountAmount? }`; the built-in templates read `EMAIL_FROM`, `EMAIL_WEBSITE_NAME` and `EMAIL_WEBSITE_URL` when a message is built.

**5. Reimbursement codes.** The built-in code handlers check `DISCOUNT_CODE_SECRET` when the engine starts: set it to 32 random bytes as hex (`openssl rand -hex 32`, 64 characters) or leave it unset. Any other value (for example a 16-byte siphash key) stops the engine. The built-in codes (`v1.<payload>.<signature>`) do not verify codes of your own format. To keep codes you already sent out working, pass your generator:

```ts
pluginRegistry.register(
  createTicketingPlugin({
    // Replaces the built-in handlers; DISCOUNT_CODE_SECRET is then not checked by ticketing
    discountCode: {
      generate: async (amount, currencyCode) => myLegacyGenerate(amount, currencyCode),
      verify: async (code, currencyCode) => myLegacyVerify(code, currencyCode), // amount in minor units, or null
    },
  }),
);
```

`ReimbursementCodePlugin` uses the discount key `shop.unchained.discount.reimbursement-code`. Order discounts store the key: open carts with a code of your own reimbursement adapter need that adapter, so keep yours registered under its key, or move the stored discounts once your handlers verify the old codes:

```js
db.order_discounts.updateMany(
  { discountKey: '<your reimbursement discount key>' },
  { $set: { discountKey: 'shop.unchained.discount.reimbursement-code' } },
);
```

**6. Ticket issuer and the provider swap.** Replace custom ticket minters (typically v4 adapters registered with `WarehousingDirector.registerAdapter`) and the ETH minter with the ticket issuer (`shop.unchained.warehousing.ticket`): one ticket per seat, atomic serial numbers per event, stock from `tokenization.supply`, redemption within an entry window (`entryOpensMinutesBefore`, default 120; `entryClosesMinutesAfter`, default 60; 480 opens the gate 8 hours early), and `ticketMeta` for per-seat data such as `{ attendeeName }` (for example the participant names from the order context). Serial numbers continue after the highest serial an event already has; for new events, `serialOffset` replaces `MINTER_TOKEN_OFFSET` (`-1` keeps 0-based numbering).

The adapter key of a provider cannot be changed through GraphQL or the Admin UI, and deleting the old provider and creating a new one leaves a gap: while two `VIRTUAL` providers are active every ticket is issued twice (and the older one decides at the gate); while none is, confirmed orders silently get no tickets. Swap the key in place (the collection name has a hyphen, so use `getCollection`; `db.warehousing-providers` is a subtraction in mongosh):

```js
db.getCollection('warehousing-providers').updateOne(
  { _id: '<your ticket provider id>', type: 'VIRTUAL' },
  {
    $set: {
      adapterKey: 'shop.unchained.warehousing.ticket',
      configuration: [
        { key: 'entryOpensMinutesBefore', value: '480' },
        { key: 'entryClosesMinutesAfter', value: '60' },
        { key: 'serialOffset', value: '0' },
      ],
    },
  },
);
// must report matchedCount: 1

db.getCollection('warehousing-providers').find({ type: 'VIRTUAL', deleted: null }, { adapterKey: 1 });
// must list exactly one provider, with adapterKey 'shop.unchained.warehousing.ticket'
```

Restart the engine and remove the old adapter only after both checks pass; until then, keep it registered. A provider whose adapter is not registered is not skipped: `WarehousingDirector.actions` throws `Warehousing Plugin <key> not available`, so checkouts fail after the payment is confirmed (the order is `CONFIRMED` but has no tickets), and `scanTicket` fails for every valid ticket.

Existing tickets keep working: tokens do not reference their provider. They have no `meta.attendeeName`, though, which is the only attendee source of `Token.attendeeName`, Gate Control, the event detail, the CSV export and the name search of `ticketLookup`. If your old adapter stored names under other keys, backfill them once. The example reads `meta.firstName` / `meta.lastName`; adapt the keys to yours:

```js
db.token_surrogates.updateMany(
  {
    'meta.attendeeName': { $exists: false },
    $or: [{ 'meta.firstName': { $type: 'string' } }, { 'meta.lastName': { $type: 'string' } }],
  },
  [
    {
      $set: {
        'meta.attendeeName': {
          $trim: {
            input: {
              $concat: [
                { $cond: [{ $eq: [{ $type: '$meta.firstName' }, 'string'] }, '$meta.firstName', ''] },
                ' ',
                { $cond: [{ $eq: [{ $type: '$meta.lastName' }, 'string'] }, '$meta.lastName', ''] },
              ],
            },
          },
        },
      },
    },
  ],
);
```

Have `ticketMeta` write the same format for new tickets, for example `{ attendeeName: [firstName, lastName].filter(Boolean).join(' ') }`.

Event facts are read from `product.meta` (`slot`, `location`, `durationMinutes`, `doorsOpenMinutesBefore`, `category`), so events that keep `meta.slot` and `meta.location` need no change; rename other keys such as `meta.doorOpeningBeforeMinutes` to these (`updateTicketEvent`, bulk import).

CMS or ETL syncs through the bulk importer: `cancelEvent` stores the cancellation in `product.meta.cancelled` / `meta.cancelledDate`, and a product `CREATE` (upsert) or `UPDATE` that sends `specification.meta` replaces `meta` as a whole, which un-cancels the event so it sells again. Leave `meta` out of the sync, carry `cancelled` / `cancelledDate` over from the engine, or unpublish cancelled events in the source. The event details live in `meta` as well, so a sync that sends it must also bring them, not rely on `updateTicketEvent` or the event editor.

Wire `validateTicketOrderPosition` (or `createTicketOrderPositionValidator({ getSaleRules })`, which also runs core's default check) as `options.orders.validateOrderPosition`, or call it from your own validator; it keeps sales within the supply, refuses tickets of cancelled events and applies the sale rules stored in `meta.saleRules` of the ticket and its production (see step 12).

**7. Gate access.** Gate staff use their own accounts with the `ticketing` role and the `scanTicket` mutation. Pass codes (such as a `meta.scannerPassCode` on the event), gate cookies and scanner logins are not supported. Ticketing gives staff the buyer's public profile only: roles that granted `viewUserPrivateInfos`, orders or e-mail addresses to scanners should go. Show attendees through `Token.attendeeName`, filled by `ticketMeta`. Custom adapters that spread `token.meta` into their `tokenMetadata` put per-ticket data into `Token.ercMetadata`; the ticket issuer serves only public product facts there (name, description, image, properties), so clients that read `Token.ercMetadata.<field>` (visitor lists, for example) switch to `Token.attendeeName`. Organizers that share a shop are separated with `withTicketing(options, { canAccessEvent })`.

Gate Control's camera only accepts ticket QR codes, a ticket id with its access key (`?hash=`), so renderers must print `buildTicketScanPayload`. Serials, names and order numbers can be typed, but they prove nothing about who holds the ticket and are never redeemed without a tap. One gate can admit several events: tick them in the event list, or admit all categories of one performance at once (stored as `?event=a,b`). This replaces event-agnostic scanner pages for performances sold as several products (category × time slot).

**8. `scanTicket` instead of `invalidateToken`.** Storefront and scanner flows that redeemed tickets with the core `invalidateToken` mutation and the QR code's access key should call `scanTicket(tokenId, productId)` with a staff account. `scanTicket` refuses with `TicketWrongEventError`, `TicketCanceledError`, `TicketAlreadyRedeemedError` or `TicketNotRedeemableError` (with a `reason`) instead of `TokenWrongStatusError`, and emits `TICKET_REDEEMED`. `invalidateToken` still works for owners, access-key and magic-key holders within the entry window.

**9. Magic keys and the print link.** The `viewOrder` rule accepts the magic key as `x-magic-key` header or as `otp` parameter, so `/rest/print_tickets?orderId=…&otp=…` links work without a custom rule; token rules find the order through the order position when `meta.orderId` is missing. Delete project overrides of these rules. `Order.magicKey` and `Order.ticketsPdfUrl` return the key and the link; `getTicketAttachments()` builds e-mail attachments.

**10. Wallet routes and renderers.**

- `GET /rest/google-wallet/download/<tokenId>` redirects (`302`) to the save link again; v5 alphas answered JSON `{ passLink }`. The renderer returns the link as a string or as `{ asURL }`; `null` answers `404`.
- The Apple PassKit web service works under the default `/rest/apple-wallet` path again (v5 alphas answered `404` to device registrations and pass updates).
- Routes answer `404` for renderers you do not register.
- Use the canonical QR payload (`buildTicketScanPayload`), key Google objects by `token._id` instead of the serial number (serials repeat across events), expire Google objects on `TICKET_REDEEMED` / `TICKET_CANCELLED`, use `token._id` as Apple `serialNumber`, and check latitude/longitude. The [Ticket Renderers guide](https://docs.unchained.shop/guides/ticketing-renderers) has complete renderers. Google objects saved under serial-based ids and Apple passes with other serial numbers are not updated by the new renderers.

**11. Passes module.** `getTicketsCreated` is deprecated (use `countIssuedTickets(productId, { skipCancelled })`); it now sums token quantities and treats `meta.cancelled: false` as not cancelled. `invalidateAppleWalletPasses(unchainedAPI, token?)` re-renders only the given ticket's pass. New: `reserveTicketSerials`, `countIssuedTickets`, `countReservedTickets`. `cancelTicket(tokenId, { onlyValid })` only marks a ticket that is neither redeemed nor cancelled yet and returns `null` otherwise.

**12. Productions instead of CMS event forms.** Productions with several dates and ticket categories are created and edited in the Admin UI (**Ticketing → Events → New production**) or with `createTicketProduction` and its sibling mutations, so a CMS collection and a periodic sync that builds `ticket-proxy` configurable products are no longer needed for tickets ([Productions](https://docs.unchained.shop/guides/ticketing-setup#productions)). Sale rules are enforced by the engine instead of the storefront. To move existing events:

1. Freeze event editing in the CMS, run the sync a last time, then switch off the event part of the sync (it overwrites and deletes products); other CMS content can stay.
2. Migrate once, with the platform modules:
   - Configurable parent: add the tag `ticket-production` (keep `ticket-proxy` until the storefront no longer reads it); move `presaleStart` / `preSaleStart` to `meta.saleRules.salesStart`, `maxTicketsPerOrder` to `meta.saleRules.maxPerOrder`, `doorOpeningBeforeMinutes` to `meta.doorsOpenMinutesBefore`, `durationInMinutes` to `meta.durationMinutes`; set `meta.location`; store the category defaults as `meta.ticketCategories.<code> = { capacity, pricing }`. The variations keep the keys `slot` (ISO start) and `category` (code); project keys (`ticketPreSalePlace`, `formId`, `invitationOnly`, `printerMacAddress`) stay.
   - Tokenized dates: move `tokenization.ercMetadataProperties.slot` and `.category` to `meta.slot` (as a Date; CMS strings like `2026-11-01 20:00` are local time) and `meta.category`, write the tokenization without `ercMetadataProperties`, and keep `_id`, slugs and labels.
   - Drop `meta.scannerPassCode`: gate staff use accounts (step 7). A `doorOpening` time like `19:30` becomes the minutes before the start.
   - Run `syncTicketProduction` for every production.
3. Storefronts list `ticketProductions` (or `products(tags: ["ticket-production"])`), read dates, location and sale rules from `TokenizedProduct.event` and handle `TicketSaleNotStartedError` / `TicketOrderLimitExceededError` instead of checking presale and order limits themselves.

**13. Gate Control instead of scanner apps.** Door staff scan and redeem in the Admin UI (**Ticketing → Gate Control**, `/ext/gate-control`) instead of a scanner page in the storefront: camera or USB/Bluetooth scanner, lookup by serial, attendee name or order number, several events per gate, the attendee list with Redeem, Cancel (with `cancelTicket`) and Export CSV, and a full-screen kiosk mode. With steps 6, 7 and 12 done:

- Printed and wallet tickets keep scanning: the scanner reads `https://…/download/<tokenId>?hash=…`, `unchained-scanner://<tokenId>?hash=…` and `unchained://ticket/<tokenId>?hash=…`, and the access key is still `buildAccessKeyFromToken` (keep `UNCHAINED_SECRET`). Codes with the MD5 key of tickets issued before mid 2024 are refused as outdated; look those tickets up by serial or name.
- Give door staff accounts with the `ticketing` role (and `cancelTicket` if they cancel at the door). Gate staff see the buyer's e-mail and phone for tickets of events around the gate period (`viewUserContactInfos`), so the contact lookups of the old scanner apps are not needed. The camera needs the Admin UI on HTTPS.
- Replace the storefront `/scan/…` pages with a redirect to `<admin-ui>/ext/gate-control` and remove their links (footer, event portal). Keep the `/download/<tokenId>` page for customers.
- Remove what only served the old scanner: scan roles that granted private user data, `x-token-accesskey` or pass-code rules and cookies, and custom `updateToken` rules for staff (`scanTicket` checks the ticket, the event and the entry window on the server).
- Label printers or other side effects on admission subscribe to `TICKET_REDEEMED` instead of `TOKEN_INVALIDATED`, which a cancellation emits as well.

### Upgrading from an earlier v5 alpha: one-time re-login

A user without a stored `tokenVersion` is now treated as version `0` (earlier alphas used `1`, which made the first revocation a no-op). Tokens those alphas issued to such users are rejected after the upgrade, so affected users log in once more. No data change is needed.

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
