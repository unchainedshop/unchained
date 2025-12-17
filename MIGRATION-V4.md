# Migration Guide v3 -> v4

With this release we fix some long standing issues with the way we named certain fields in the API and in our Codebase. That means this version will probably break clients, plugins and bulk import streams.

**Important:** If you upgrade to this version from <3, first upgrade to the latest v3 to not miss any migrations.

## Currency & Country Codes

We have removed the ambiguity about the currency iso codes. Before it was not clear if a currency for example is an object of a currency or a string. Sometimes we used currency, sometimes we used currencyContext and sometimes currencyCode.

### Context Changes

```diff
- context.currencyContext
+ context.currencyCode

- context.countryContext
+ context.countryCode

- context.localeContext
+ context.locale
```

### GraphQL API Changes

All queries and mutations that had a `currency` input or field are renamed to `currencyCode` unless it's a Currency object itself. Same for `country` -> `countryCode`.

Affected types and fields include:
- `Price.currency` → `Price.currencyCode`
- `DeliveryProvider.simulatedPrice(currency: ...)` → `DeliveryProvider.simulatedPrice(currencyCode: ...)`
- `PaymentProvider.simulatedPrice(currency: ...)` → `PaymentProvider.simulatedPrice(currencyCode: ...)`
- `SimpleProduct.catalogPrice(currency: ...)` → `SimpleProduct.catalogPrice(currencyCode: ...)`
- `SimpleProduct.leveledCatalogPrices(currency: ...)` → `SimpleProduct.leveledCatalogPrices(currencyCode: ...)`
- `SimpleProduct.simulatedPrice(currency: ...)` → `SimpleProduct.simulatedPrice(currencyCode: ...)`
- `PlanProduct.catalogPrice(currency: ...)` → `PlanProduct.catalogPrice(currencyCode: ...)`
- `TokenizedProduct.catalogPrice(currency: ...)` → `TokenizedProduct.catalogPrice(currencyCode: ...)`
- `ConfigurableProduct.simulatedPriceRange(currency: ...)` → `ConfigurableProduct.simulatedPriceRange(currencyCode: ...)`
- `ConfigurableProduct.catalogPriceRange(currency: ...)` → `ConfigurableProduct.catalogPriceRange(currencyCode: ...)`
- `Order.currency` → `Order.currencyCode`

### Database Migrations

A migration automatically renames `currency` to `currencyCode` in:
- `Orders`
- `Quotations`
- `CryptopayTransaction`

### Pricing Sheet Changes

If you have custom pricing plugins, update your code:

```diff
- currency: order.currency
+ currencyCode: order.currencyCode

// In pricing sheet results:
- const { currency, amount } = pricingSheet.total();
+ const { currencyCode, amount } = pricingSheet.total();

// When creating pricing sheets:
- ProductPricingSheet({ calculation, currency, quantity })
+ ProductPricingSheet({ calculation, currencyCode, quantity })
```

## Bulk Import

```diff
- import { BulkImportOperation } from '@unchainedshop/platform';
- const handler: BulkImportOperation = async (
+ import { BulkImportOperation } from '@unchainedshop/core';
+ const handler: BulkImportOperation<unknown> = async (
```

Bulk Import now validates data against Zod schemas, returning early with an error when the structure is invalid.

## Product Types

`Mutation.createProduct` and BulkImport Product payloads now require `type` to be an uppercase enum:

```diff
- type: "simple"
+ type: "SIMPLE"

- type: "configurable"
+ type: "CONFIGURABLE"

- type: "bundle"
+ type: "BUNDLE"

- type: "plan"
+ type: "PLAN"
```

## Removed Mutations

The `CARD` payment type has been removed:
- `Mutation.updateOrderPaymentCard` - **removed**

## Deprecated Mutations

The following mutations are deprecated in favor of new cart-based mutations:

```diff
# Old (deprecated)
- setOrderDeliveryProvider(orderId, deliveryProviderId)
- setOrderPaymentProvider(orderId, paymentProviderId)
- updateOrderDeliveryShipping(orderDeliveryId, ...)
- updateOrderDeliveryPickUp(orderDeliveryId, ...)
- updateOrderPaymentInvoice(orderPaymentId, ...)
- updateOrderPaymentGeneric(orderPaymentId, ...)

# New (recommended)
+ updateCartDeliveryShipping(orderId, deliveryProviderId, address, meta)
+ updateCartDeliveryPickUp(orderId, deliveryProviderId, orderPickUpLocationId, meta)
+ updateCartPaymentInvoice(orderId, paymentProviderId, meta)
+ updateCartPaymentGeneric(orderId, paymentProviderId, meta)
```

The new mutations both set the provider and update its configuration in a single call.

## Query Changes

### Events Query
`Query.events` and `Query.eventsCount` now accept `DateFilterInput` for filtering by creation date:

```diff
- events(created: DateTime)
+ events(created: DateFilterInput)  # { start: DateTime, end: DateTime }

- eventsCount(created: DateTime)
+ eventsCount(created: DateFilterInput)
```

### Orders Query
New filter options added to `Query.orders` and `Query.ordersCount`:
- `paymentProviderIds: [String!]`
- `deliveryProviderIds: [String!]`
- `dateRange: DateFilterInput`

### Interface Queries
The `type` parameter is now optional for interface queries:
```diff
- deliveryInterfaces(type: DeliveryProviderType!): [DeliveryInterface!]!
+ deliveryInterfaces(type: DeliveryProviderType): [DeliveryInterface!]!

- paymentInterfaces(type: PaymentProviderType!): [PaymentInterface!]!
+ paymentInterfaces(type: PaymentProviderType): [PaymentInterface!]!

- warehousingInterfaces(type: WarehousingProviderType!): [WarehousingInterface!]!
+ warehousingInterfaces(type: WarehousingProviderType): [WarehousingInterface!]!
```

### Users Query
New filter options:
- `tags: [LowerCaseString!]`

## Boolean Filter Behavior

Boolean filter types (SWITCH) behavior has changed:
- When a key is set in a filter query without an explicit value, it will only show products that have a value of `true`
- To do "NOT" filtering, explicitly provide a value of `false` or `0`:

```graphql
# Only shows products where meta.feeds.googleAds is true
[{ key: "meta.feeds.googleAds" }]

# Shows products where meta.feeds.googleAds is false
[{ key: "meta.feeds.googleAds", value: "false" }]
```

## Work Queue Options

```diff
# In startPlatform options:
- workQueueOptions: { retryInput: ... }
+ workQueueOptions: { transformRetry: ... }
```

New parameter `enabledQueueManagers` can be adjusted to customize which work queue managing plugins are active.

## Bundle Products

Bundle Products now support their own pricing. The default catalog pricing plugin falls back to summing bundled product prices, but you can now set prices directly on bundle products.

## SMS Providers

- Twilio worker plugin renamed from `SMS` to `TWILIO`
- New SMS providers added: `BudgetSMS`, `Bulkgate`

## Payment Plugin Changes

If you have custom payment plugins, `paymentProviderId` has been removed from the adapter context. Access it through the provider object instead.

## Optional Dependencies

MCP and AI server packages (`@modelcontextprotocol/sdk`, `ai`) are now optional peer dependencies. Install them only if you need AI/MCP features.

## New Features in v4

### MCP Support
Experimental Model Context Protocol support for AI integrations. The MCP server allows AI apps to read and manage data in Unchained.

### DocumentDB Compatibility
Use `UNCHAINED_DOCUMENTDB_COMPAT_MODE` environment variable for FerretDB/AWS/Azure DocumentDB compatibility (disables $text indexes and $search queries).

### Admin UI Configuration
New environment variables for Admin UI configuration:
- `UNCHAINED_ADMIN_UI_DEFAULT_PRODUCT_TAGS`
- `UNCHAINED_ADMIN_UI_DEFAULT_ASSORTMENT_TAGS`
- `UNCHAINED_ADMIN_UI_DEFAULT_USER_TAGS`
- `UNCHAINED_ADMIN_UI_CUSTOM_PROPERTIES`
- `UNCHAINED_ADMIN_UI_SINGLE_SIGN_ON_URL`

### Product Discoverability
New convenience helper for hiding products from search:

```ts
import { registerProductDiscoverabilityFilter } from '@unchainedshop/core';
registerProductDiscoverabilityFilter({ hiddenTagValue: 'hidden' });
```

### Delivery Provider Pickup Locations
`DeliveryProvider` now exposes `pickupLocations` directly (previously only on `OrderDelivery`).
