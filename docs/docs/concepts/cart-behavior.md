---
sidebar_position: 2
title: Cart Behavior
description: Learn about the cart and it's advanced features
sidebar_label: Cart
---
# Cart Behavior


In Unchained, you can add products and quotations to carts, but only products will remain in the cart in the end. When adding products to the cart, they are transformed according to the following rules:

Products:
- When adding a SimpleProduct or BundleProduct, the system adds the product to the cart with no transformation happening.
- When exploding a BundleProduct, it will be removed from the cart and its parts will be added to the cart.
- When adding a ConfigurableProduct, the system resolves to the concrete product if enough variation vector parameters are provided through the product configuration parameters. If not, the operation will fail. The variation configuration is stored on the resolved item along with the user-provided parameters.

When one product leads to another, the source productId is saved in context.origin. This way, a SimpleProduct item still has a reference to the ConfigurableProduct for UX purposes.

Quotations:
When adding a Quotation to the cart, the actual product will be resolved and added to the cart. It uses the transform method of the quotation plugin system to transform a quotationConfiguration into a productConfiguration. The source quotationId is saved in context.origin.


It is also possible to chain operations:

1. addCartQuotation is called with quotation Y
2. quotation Y is resolved to a configurable product X with a specific configuration
3. the specific configuration is handed to the vector logic to try to find a distinct concrete product Z
4. bundle product Z is resolved

Now the cart looks like this:

1 x Bundle Z (e.g. a piece of furniture)

Now, if you explode the bundle, the cart will contain:

1 x Part A
2 x Part B
10 x Part C