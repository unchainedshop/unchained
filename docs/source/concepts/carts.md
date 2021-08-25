---
title: "Cart Behavior"
description: Learn about the cart and it's advanced features
---

# Orderable Items

In Unchained, you can add products and quotations to carts but in the end, only products will be left in the cart. Input products when adding to cart are transformed by specific rules:

Products:

- When adding a SimpleProduct or BundleProduct, the system just adds that product to the cart with no transformation happening
- When exploding a BundleProduct, it will get removed from the cart and it's parts are added to the cart
- When adding a ConfigurableProduct, the system resolves to the concrete product if enough variation vector parameters provided through product configuration parameters, else the operation will fail. The variation configuration is stored on the resolved item along user provided parameters.

When one product leads to another, the source productId is saved into context.origin. That way a SimpleProduct item still has a reference to the ConfigurableProduct for UX purposes.

Quotations:

- When adding a Quotation to the cart, the actual product will get resolved and added to the cart. It uses a transform method of the quotation plugin system to transform a quotationConfiguration to a productConfiguration. The source quotationId is saved into context.origin

It's also possible to chain:

addCartQuotation is called with quotation Y
-> resolves to a configurable product X with a specific configuration
-> specific configuration is handed to vector logic trying to find a distinct concrete product Z
-> bundle product Z is resolved

Now the cart looks like this:

1 x Bundle Z (A furniture for ex.)

Now you could explode the bundle and the cart will result in:

1 x Part A
2 x Part B
10 x Part C
