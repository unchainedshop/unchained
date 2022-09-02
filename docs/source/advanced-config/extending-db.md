---
title: "Extending DB"
description: Adding and extending database collections
---



There might come a time where you might want to store additional data for your shop. Wether you want to create a new collection or extend the existing database collection to include additional fields unchained engine has you covered.

## Adding new collection

If you want add new collection there is not much configuration steps you need to follow. All you need to do import the `MongoClient` with the correct db URI and you have access to all native mongodb functions.
By default if you are running unchained locally the database URI is at 

```typescript
mongodb://localhost:4011/unchained
```

```typescript

import {MongoClient } from "mongodb"

  const mongoClient = new MongoClient("mongodb://localhost:4011/unchained", {
    useUnifiedTopology: true,
    ignoreUndefined: true,
  })

  const mongo = await mongoClient.connect();
  const db = mongo.db()

```

In the above code we imported `MongoClient`, created an instance by providing the our database URI, connected to the database and finally retrieved the underling database by calling the instance function `db`.

Now that we have the db instance we can call all the native mongo functions on it, including creating, finding, deleting etc... on the code bellow we are creating a collection `example_collection` and added an index to it using built in helper function `buildDbIndexes` to use in our shop.

```typescript
import { buildDbIndexes } from '@unchainedshop/utils';
...
const ExampleCollection = await db.collection('example_collection')
  await buildDbIndexes(ExampleCollection, [
    { index: { exampleId: 1 } },
  ]);
  
```


## Extending existing collection
Every collection used in Unchained engine provides a simple API to extend it's field definitions. In order to extend one of the default collection you first have to import its corresponding Schema. 

Every collection schema is defined using [`simple-schema`](https://www.npmjs.com/package/simpl-schema) which mean you can use any of the functions defined there on all import of unchained collection schema definition and expect the same result.

As an example lets import the `Users` collection schema definition `UsersSchema` and add a new `age` field.

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
| **AssortmentMediasSchema**, **AssortmentMediaTextsSchema** | `@unchainedshop/core-assortments/src/db/AssortmentMediasSchema` |
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

