---
sidebar_position: 5
title: Carts
description: Learn about how carts works
sidebar_label: Carts
---

# Carts

In this chapter, you will learn how Unchained reacts to Cart changes.

## Order Context

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