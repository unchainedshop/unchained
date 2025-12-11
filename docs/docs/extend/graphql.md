---
sidebar_position: 6
title: Extend the GraphQL API
sidebar_label: GraphQL API
description: Extending the schema to hold custom types
---

# Extend the GraphQL API

We know that any two projects don't have the same business logic and data model. Projects need different data models to hold data for of there domain so for this reason unchained is build to be easily extended to hold custom data a project might need.

Most mutations of unchained accept a JSON type `meta` property for this purpose. you can pass this field and object holding custom properties you want to store related to a certain entity/object.

In this we will extend `product` to hold two custom properties `size` and `expiryDate` for demonstration purposes.

In order to extend the schema, all we need to do is

- Extend the entity in question to include the custom fields
- Add a resolver function to resolve the field from the meta field of the entity.
- Register the type and resolver definitions in unchained passing them to the `startPlatform` function at boot time.

Let's follow the above guide to extend the `Product` entity.

**Extend entity include the custom fields**

```js
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
mutation UpdateProductMeta {
  updateProduct(
    productId: "test-product-id"
    product: {
      meta: { size: "large", expiryDate: "1694908800000" }
    }
  ) {
    _id
  }
}
```

Note: The `size` and `expiryDate` fields shown above are custom fields added via resolvers and would need to be queried after the type extensions are registered.

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

## Using Pothos GraphQL

If you prefer a code-first approach to GraphQL, you can use [Pothos](https://pothos-graphql.dev/) with Unchained. This allows you to define your schema using TypeScript instead of SDL.

### Setup

```typescript
import { buildDefaultTypeDefs } from '@unchainedshop/api/lib/schema/index.js';
import unchainedResolvers from '@unchainedshop/api/lib/resolvers/index.js';
import { makeExecutableSchema, mergeSchemas } from '@graphql-tools/schema';
import SchemaBuilder from '@pothos/core';
import { startPlatform } from '@unchainedshop/platform';
import { roles } from '@unchainedshop/api';

// Build the Unchained schema
const unchainedSchema = makeExecutableSchema({
  typeDefs: buildDefaultTypeDefs({
    actions: Object.keys(roles.actions),
  }),
  resolvers: [unchainedResolvers],
});

// Create Pothos builder
const builder = new SchemaBuilder({});

// Define your custom types
builder.queryType({
  fields: (t) => ({
    hello: t.string({
      args: {
        name: t.arg.string(),
      },
      resolve: (parent, { name }, unchainedContext) => {
        return `Hello, ${name || 'World'}!`;
      },
    }),
  }),
});

// Merge schemas
const schema = mergeSchemas({
  schemas: [unchainedSchema, builder.toSchema()],
});

// Start with merged schema
const engine = await startPlatform({
  schema,
});
```

### Adding Custom Types

```typescript
const builder = new SchemaBuilder({});

// Define a custom type
builder.objectType('CustomProduct', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    customField: t.string({
      resolve: (parent) => `Custom: ${parent.name}`,
    }),
  }),
});

// Add query for custom type
builder.queryType({
  fields: (t) => ({
    customProducts: t.field({
      type: ['CustomProduct'],
      resolve: async (parent, args, context) => {
        // Use Unchained context to fetch data
        const products = await context.modules.products.findProducts({});
        return products.map(p => ({
          id: p._id,
          name: p.texts?.title || 'Untitled',
        }));
      },
    }),
  }),
});
```

### Adding Mutations

```typescript
builder.mutationType({
  fields: (t) => ({
    createCustomEntry: t.field({
      type: 'String',
      args: {
        input: t.arg({
          type: builder.inputType('CreateCustomEntryInput', {
            fields: (t) => ({
              name: t.string({ required: true }),
              value: t.int({ required: true }),
            }),
          }),
          required: true,
        }),
      },
      resolve: async (parent, { input }, context) => {
        // Your custom mutation logic
        return `Created: ${input.name}`;
      },
    }),
  }),
});
```

This approach is useful when you want type-safe schema definitions and auto-completion in your IDE.