---
sidebar_position: 5
sidebar_label: Extending DB
title: Extend DB Entity Schemas
---
:::
 Adding and extending database collections
:::
## Extending existing collection
Every MongoDB collection used in Unchained engine provides a simple API to extend it's field definitions.

If you add new fields to existing schemas with custom code you should also make sure that you extend the [`simple-schema`](https://www.npmjs.com/package/simpl-schema) definition, because sometimes, Unchained sanitizes data based on those definitions.

In order to do that you first have to import its corresponding Schema.

As an example lets import the `Users` collection schema definition `UsersSchema` and add a new `age` field:

```typescript
import { UsersSchema } from "@unchainedshop/utils/src/db/UsersSchema"

UsersSchema.extend(
  {
    age: String,
  },
  { requiredByDefault: false },
);
```

For more schema configuration options refer to [`simple-schema`](https://www.npmjs.com/package/simpl-schema)
Below are all of the built in collections  schema definitions and import location.


| Schema                           | Import location                                                   |
| :--------------------------------------- | :---------------------------------------------------------- |
| **AssortmentsSchema**, **AssortmentLinksSchema**, **AssortmentTextsSchema**, **AssortmentProductsSchema** , **AssortmentFiltersSchema**  | `@unchainedshop/core-assortments/src/db/AssortmentsSchema` |
| **AssortmentMediaSchema**, **AssortmentMediaTextsSchema** | `@unchainedshop/core-assortments/src/db/AssortmentMediaSchema` |
| **BookmarkSchema** | `@unchainedshop/core-bookmarks/src/db/BookmarkSchema` |
| **CountriesSchema** | `@unchainedshop/core-countries/src/db/CountriesSchema` |
| **CurrenciesSchema** | `@unchainedshop/core-currencies/src/db/CurrenciesSchema` |
| **DeliveryProvidersSchema** | `@unchainedshop/core-delivery/src/db/DeliveryProvidersSchema` |
| **PeriodSchema**, **EnrollmentsSchema** | `@unchainedshop/core-enrollments/src/db/EnrollmentsSchema` |
| **EventsSchema** | `@unchainedshop/core-events/src/db/EventsSchema` |
| **MediaObjectsSchema** | `@unchainedshop/core-files/src/db/MediaObjectsSchema` |
| **FiltersSchema**, **FilterTextsSchema** | `@unchainedshop/core-filters/src/db/FiltersSchema` |
| **LanguagesSchema** | `@unchainedshop/core-languages/src/db/LanguagesSchema` |
| **OrderDeliveriesSchema** | `@unchainedshop/core-orders/src/db/OrderDeliveriesSchema` |
| **OrderDiscountsSchema** | `@unchainedshop/core-orders/src/db/OrderDiscountsSchema` |
| **OrderPaymentsSchema** | `@unchainedshop/core-orders/src/db/OrderPaymentsSchema` |
| **OrderPositionsSchema** | `@unchainedshop/core-orders/src/db/OrderPositionsSchema` |
| **OrdersSchema** | `@unchainedshop/core-orders/src/db/OrdersSchema` |
| **PaymentCredentialsSchema** | `@unchainedshop/core-payment/src/db/PaymentCredentialsSchema` |
| **PaymentProvidersSchema** | `@unchainedshop/core-payment/src/db/PaymentProvidersSchema` |
| **ProductMediaSchema**, **ProductMediaTextsSchema** | `@unchainedshop/core-products/src/db/ProductMediaTextsSchema` |
| **ProductReviewsSchema** | `@unchainedshop/core-products/src/db/ProductReviewsSchema` |
| **ProductsSchema**, **ProductTextsSchema** | `@unchainedshop/core-products/src/db/ProductsSchema` |
| **ProductVariationsSchema**, **ProductVariationTextsSchema** | `@unchainedshop/core-products/src/db/ProductVariationsSchema` |
| **QuotationsSchema** | `@unchainedshop/core-quotations/src/db/QuotationsSchema` |
| **WarehousingProvidersSchema** | `@unchainedshop/core-warehousing/src/db/WarehousingProvidersSchema` |
| **WorkQueueSchema** | `@unchainedshop/core-worker/src/db/WorkQueueSchema` |
| **UsersSchema**, **ProfileSchema**, **LastLoginSchema**, **LastContactSchema** | `@unchainedshop/utils/src/db/UsersSchema` |
| **ContactSchema** | `@unchainedshop/utils/src/db/ContactSchema` |
| **AddressSchema** | `@unchainedshop/utils/src/db/AddressSchema` |