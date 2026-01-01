# Migration Guide

**Important:** Always upgrade to the latest patch version of each major version before upgrading to the next major version.

---

## v4 → v5 (Drizzle Migration)

This is a **major architectural change** from MongoDB to Drizzle ORM with SQLite/Turso. This migration requires careful planning and data migration.

### Prerequisites

1. Backup your MongoDB database
2. Export data for migration (see Data Migration section)
3. Set up SQLite or Turso database
4. Update all dependencies

### Environment Variables

```diff
# Removed
- MONGO_URL=mongodb://localhost:27017/unchained
- MONGO_REPLICASET_URL=...
- UNCHAINED_DOCUMENTDB_COMPAT_MODE=1

# Added
+ DRIZZLE_DB_URL=file:unchained.db              # Local SQLite file
+ DRIZZLE_DB_URL=file::memory:                  # In-memory (testing)
+ DRIZZLE_DB_URL=libsql://your-db.turso.io      # Turso cloud
+ DRIZZLE_DB_TOKEN=your-turso-auth-token        # Required for Turso

# Unchanged but now required
UNCHAINED_TOKEN_SECRET=minimum-32-character-secret
```

### Dependencies

Remove MongoDB packages and add Drizzle packages:

```bash
# Remove MongoDB dependencies
npm uninstall mongodb mongodb-memory-server @mongodb-js/zstd

# Add Drizzle dependencies (already included in @unchainedshop/store)
# The store package is a dependency of core packages, no need to install directly
```

### Boot File Changes

```diff
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/fastify';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/all-fastify.js';
+ import { createDrizzleDb } from '@unchainedshop/store';

const fastify = Fastify();

+ // Create database connection
+ const { db: drizzleDb } = createDrizzleDb({
+   url: process.env.DRIZZLE_DB_URL || 'file:unchained.db',
+   authToken: process.env.DRIZZLE_DB_TOKEN,
+ });

const platform = await startPlatform({
  modules: defaultModules,
+ drizzleDb,
});

connect(fastify, platform, {
  initPluginMiddlewares,
  adminUI: true,
});

await fastify.listen({ host: '::', port: 3000 });
```

### Package Import Changes

```diff
# Database utilities
- import { mongodb, generateDbObjectId } from '@unchainedshop/mongodb';
+ import { eq, generateId, type DrizzleDb } from '@unchainedshop/store';

# Types (unchanged - still from respective packages)
import { User } from '@unchainedshop/core-users';
import { Order } from '@unchainedshop/core-orders';
```

### Custom Module Migration

If you have custom modules using MongoDB:

```diff
- import { mongodb, buildFindSelector } from '@unchainedshop/mongodb';
+ import { eq, and, isNull, sql, type DrizzleDb } from '@unchainedshop/store';
+ import { myTable, rowToMyEntity } from '../db/index.js';

- export const configureMyModule = async ({ db }) => {
-   const collection = await db.collection('my_entities');
+ export const configureMyModule = async ({ db }: { db: DrizzleDb }) => {

  return {
-   findOne: async ({ _id }) => {
-     return collection.findOne({ _id });
-   },
+   findOne: async ({ _id }) => {
+     const [row] = await db.select().from(myTable)
+       .where(eq(myTable._id, _id))
+       .limit(1);
+     return row ? rowToMyEntity(row) : null;
+   },

-   find: async (query) => {
-     return collection.find(buildFindSelector(query)).toArray();
-   },
+   find: async (query) => {
+     const conditions = [isNull(myTable.deleted)];
+     if (query.status) conditions.push(eq(myTable.status, query.status));
+     const rows = await db.select().from(myTable)
+       .where(and(...conditions));
+     return rows.map(rowToMyEntity);
+   },
  };
};
```

### Schema Definition

Create schema files for custom tables:

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const myTable = sqliteTable('my_entities', {
  _id: text('_id').primaryKey(),
  name: text('name').notNull(),
  status: text('status'),
  data: text('data', { mode: 'json' }),  // JSON columns for complex data
  created: integer('created', { mode: 'timestamp_ms' }).notNull(),
  updated: integer('updated', { mode: 'timestamp_ms' }),
  deleted: integer('deleted', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_my_entities_status').on(table.status),
]);

export type MyEntityRow = typeof myTable.$inferSelect;

export function rowToMyEntity(row: MyEntityRow): MyEntity {
  return {
    _id: row._id,
    name: row.name,
    status: row.status ?? undefined,
    data: row.data ?? undefined,
    created: row.created,
    updated: row.updated ?? undefined,
  };
}
```

```typescript
// src/db/index.ts
import { sql, type DrizzleDb } from '@unchainedshop/store';

export * from './schema.js';

export async function initializeMySchema(db: DrizzleDb): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS my_entities (
      _id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT,
      data TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_my_entities_status ON my_entities(status)`);
}
```

### Full-Text Search Migration

Replace MongoDB `$text` searches with FTS5:

```diff
- // MongoDB text search
- const results = await collection.find({
-   $text: { $search: searchText }
- }).toArray();

+ // Drizzle FTS5 search
+ import { createFTS } from '@unchainedshop/store';
+
+ const myFTS = createFTS({
+   ftsTable: 'my_entities_fts',
+   sourceTable: 'my_entities',
+   columns: ['_id', 'name', 'description'],
+ });
+
+ // In schema initialization
+ await myFTS.setup(db);
+
+ // In search function
+ const matchingIds = await myFTS.search(db, searchText);
+ const results = await db.select().from(myTable)
+   .where(inArray(myTable._id, matchingIds));
```

### Authentication Changes

The authentication system has been refactored:

```diff
# Token versioning for session revocation
+ User.tokenVersion: number  // Increment to invalidate all sessions

# New mutation
+ Mutation.logoutAllSessions  // Invalidates all user sessions

# OIDC provider support
+ const authHandler = createAuthHandler({
+   oidcProviders: [{
+     name: 'keycloak',
+     issuer: 'https://keycloak.example.com/realms/master',
+     audience: 'your-client-id',
+     rolesPath: ['realm_access', 'roles'],
+     roleMapping: { admin: 'admin', user: 'user' },
+   }],
+   autoCreateOIDCUsers: true,
+ });
```

### Testing Changes

Update test setup for in-memory SQLite:

```diff
- import { MongoMemoryServer } from 'mongodb-memory-server';
+ import { createTestDb, initializeDrizzleDb } from '@unchainedshop/store';

- let mongod: MongoMemoryServer;
+ let dbConnection: ReturnType<typeof createTestDb>;

beforeAll(async () => {
- mongod = await MongoMemoryServer.create();
- process.env.MONGO_URL = mongod.getUri();
+ dbConnection = createTestDb();
+ await initializeDrizzleDb(dbConnection.db, [
+   initializeUsersSchema,
+   initializeProductsSchema,
+   // ... other schema initializers
+ ]);
});

afterAll(async () => {
- await mongod.stop();
+ dbConnection.close();
});
```

### Data Migration

Export data from MongoDB and import into SQLite/Turso:

```typescript
// Example migration script
import { MongoClient } from 'mongodb';
import { createDrizzleDb, generateId } from '@unchainedshop/store';
import { users } from './db/schema.js';

async function migrateUsers() {
  // Connect to MongoDB
  const mongoClient = new MongoClient(process.env.OLD_MONGO_URL);
  await mongoClient.connect();
  const mongoDb = mongoClient.db();

  // Connect to SQLite/Turso
  const { db } = createDrizzleDb({
    url: process.env.DRIZZLE_DB_URL,
    authToken: process.env.DRIZZLE_DB_TOKEN,
  });

  // Migrate users
  const mongoUsers = await mongoDb.collection('users').find({}).toArray();
  for (const user of mongoUsers) {
    await db.insert(users).values({
      _id: user._id.toString(),
      username: user.username,
      emails: JSON.stringify(user.emails),
      services: JSON.stringify(user.services),
      profile: JSON.stringify(user.profile),
      roles: JSON.stringify(user.roles),
      created: user.created?.getTime() || Date.now(),
      updated: user.updated?.getTime(),
    });
  }

  await mongoClient.close();
}
```

### Removed Features

The following features are no longer available:

- **GridFS file storage**: Use MinIO or local file storage instead
- **MongoDB migrations**: Drizzle schemas are idempotent, no migration system needed
- **DocumentDB compatibility mode**: Not applicable with SQLite/Turso
- **MongoDB-specific operators**: `$text`, `$regex`, `$in`, `$elemMatch`, etc.

### Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Cannot find module '@unchainedshop/mongodb'` | Package removed - use `@unchainedshop/store` instead |
| `MONGO_URL is not defined` | Use `DRIZZLE_DB_URL` instead |
| `collection.findOne is not a function` | Rewrite using Drizzle ORM queries |
| `$text operator not supported` | Use `createFTS()` for full-text search |
| `Cannot read property 'db' of undefined` | Pass `drizzleDb` to `startPlatform()` |
| `SQLITE_ERROR: no such table` | Ensure schema initialization runs before queries |
| `TOKEN_SECRET too short` | `UNCHAINED_TOKEN_SECRET` must be at least 32 characters |

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
