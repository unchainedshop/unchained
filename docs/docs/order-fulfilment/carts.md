---
sidebar_position: 5
title: Carts
description: Learn about how carts works
sidebar_label: Carts
---

# Carts

In this chapter, you will learn what a cart in Unchained contains and how Unchained reacts to Cart changes.

## Order Context

Every order has a `billingAddress` and a `contact`, both have to be set in order to do a checkout. It's up to you as a developer to define which fields have to be provided in order for you to process the checkout. For example if you only need a single phone number but no address and no e-mail address, this is valid:

```graphql
mutation {
  updateCart(contact: {telNumber: "+41414114141"}, billingAddress: {}) {
    _id
  }
}
```

Each order also has a `meta` context which is an arbitrary JSON object stored in the database that can be updated through `updateCart`. It can store various configurations required for custom plugins. This could be anything. If your checkout process involves an additional `comment` input field for example, that comment could be passed as meta context. Because this information is accessible by payment and delivery providers, available payment methods can be made dependendent on that data.

## Payment Provider selection

## Delivery Provider selection

## Warehousing Provider selection

## Order Position Resolution

In Unchained, you can add products and quotations to carts, but only products will remain in the cart in
the end. When adding products to the cart, they are transformed according to the following rules:

**Products:**

- Adding a SimpleProduct or BundleProduct adds the product to the cart without transformation.
- Exploding a BundleProduct removes it from the cart and adds its parts instead.
- Adding a ConfigurableProduct resolves to a concrete product if enough variation parameters are
  provided. Otherwise, the operation fails. The variation configuration is stored on the resolved item
  along with user-provided parameters.

When one product leads to another, the source productId is saved in `orderPosition.originalProductId`, maintaining a
reference for UX purposes.

**Quotations:** When adding a Quotation to the cart, the actual product is resolved and added. The
quotation plugin system transforms a `quotationConfiguration` into a `productConfiguration`, and the
source quotationId is saved in `orderPosition.originalProductId`.

**Chaining Operations:**

1. `addCartQuotation` is called with quotation Y.
2. Quotation Y resolves to configurable product X with a specific configuration.
3. The configuration is handed to the vector logic to find a distinct concrete product Z.
4. Bundle product Z is resolved.

The cart then looks like this: 1 x Bundle Z (e.g., a piece of furniture)

## Pricing and Delivery Date Invalidation