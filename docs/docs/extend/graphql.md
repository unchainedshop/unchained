---
sidebar_position: 6
title: Extend the GraphQL API
sidebar_label: GraphQL API

---
:::info
 Extending the schema to hold custom types
:::

We know that any two projects don't have the same business logic and data model. Projects need different data models to hold data for of there domain so for this reason unchained is build to be easily extended to hold custom data a project might need.

Most mutations of unchained accept a JSON type `meta` property for this purpose. you can pass this field and object holding custom properties you want to store related to a certain entity/object.

In this we will extend `product` to hold two custom properties `size` and `expiryDate` for demonstration purposes.

In order to extend the schema, all we need to do is

- Extend the entity in question to include the custom fields
- Add a resolver function to resolve the field from the meta field of the entity.
- Register the type and resolver definitions in unchained passing them to the `startPlatform` function at boot time.

Let's follow the above guide to extend the `Product` entity.

**Extend entity include the custom fields**

```graphql
const typeDefs = [
   /* GraphQL */ `
     extend type Product {
       size: String,
       expiryDate: String
     }

   `,
 ];
```

**Add a resolver function to resolve the fields**

```js
const resolverDefs = {
  SimpleProduct: {
    size({ meta = {} }) {
      return meta?.size
    },
    expiryDate({ meta = {} }) {
      return meta?.expiryDate
    },
  },
  PlanProduct: {
    size({ meta = {} }) {
      return meta?.size
    },
    expiryDate({ meta = {} }) {
      return meta?.expiryDate
    },
  },
  ConfigurableProduct: {
    size({ meta = {} }) {
      return meta?.size
    },
    expiryDate({ meta = {} }) {
      return meta?.expiryDate
    },
  },
}
```

**Register the type and resolver definition**

```js
import { startPlatform } from '@unchainedshop/platform'

await startPlatform({
  typeDefs: [...typeDefs],
  resolvers: [resolvers],
})
seed()
```

That was all, everything is setup and the schema will be updated to include the custom types defined above for product entity.
Assuming we have a `SimulatedProduct` product type with a `productId` `test-product-id`, we can use the `mutation.updateProduct` to assign values for the new fields.

```graphql
mutation {
  updateProduct(
    productId: "test-product-id"
    product: {
      meta: { "size": "large", "expiryDate": new Date("2023-09-17").getTime() }
    }
  ) {
      _id
    ... on SimpleProduct {
      size
      expiryDate
    }
  }
}
```

This will return with the updated value:

```json
{
  "_id": "test-product-id",
  "size": "large",
  "expiryDate": "2023-09-17"
}
```

### Adjust Sort Options for the default Sorting algoritm

To support sorting other than the default order index, extend available sort codes:

```
extend enum SearchOrderBy {
   meta_priceRanges_minSimulatedPrice_DESC
   meta_priceRanges_minSimulatedPrice_ASC
}
```

Explanation:

DESC at the end means it should sort descending whereas ASC or neither direction means it will sort ascending. Underscores will be replaced by dots before firing to the MongoDB, so "meta_priceRanges_minSimulatedPrice_DESC" this effectively translates to:

```
{ $sort: { "meta.priceRanges.minSimulatedPrice": -1, "_id": 1 } }
```



### List of entity types that hold meta property

```js
Assortment
AssortmentProduct
AssortmentLink
AssortmentFilter
Media
Product
ProductReview
ProductReviewVote
ConfigurableProduct
SimpleProduct
BundleProduct
PlanProduct
Enrollment
Quotation
EnrollmentPayment
EnrollmentDelivery
User
```

Note: While every entity that listed above exposes a meta property there is an exception for Order related entities. Order related entities store `meta` property and other useful information about the order under `context` property. So in order to get the `meta` value of an order you read it from the `context`. This entity types are listed below:

```
  Order
  OrderDelivery
  OrderDeliveryPickUp
  OrderDeliveryShipping
  OrderPaymentInvoice
  OrderPaymentGeneric
  OrderPayment
```

```js
const resolverDefs = {
  OrderDelivery: {
    isBatteryPart(obj) {
      return obj.context?.["isBatteryPart"] || false;
    },

```

For detail reference about graphql schema and how to extend the refer to the official [graphql documentation](https://graphql.org/learn/schema/)