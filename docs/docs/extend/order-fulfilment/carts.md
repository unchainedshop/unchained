---
sidebar_position: 2
title: Carts
description: Learn about how carts works
sidebar_label: Carts
---

# Carts

As you have learned already, in Unchained Engine, a cart is an order in initial `OPEN` state.

When using the cart mutation API's, Unchained uses the `findOrInitCart` service to find or create a cart.
It does that following this logic:

First Unchained determines the shop country based on the locale provided or fallback to default country.
Then it tries to find an `OPEN` order for that country. If an existing order has been found, that one
will be used as the cart.

If no order has been found, Unchained creates a new order for that user, providing:

- Country
- Currency
- Billing address of the last order if possible
- Contact information of the last order if possible

Because billing address and contact information could be undefined, before you can checkout, you have to
make sure that order context is set and that the cart has add at least one order position.

## Order Context

Every order has a `billingAddress` and a `contact`, both have to be set in order to do a checkout. It's
up to you as a developer to define which fields have to be provided in order for you to process the
checkout. For example if you only need a single phone number but no address and no e-mail address, this
is valid:

```graphql
mutation {
  updateCart(contact: { telNumber: "+41414114141" }, billingAddress: {}) {
    _id
  }
}
```

Each order also has a `meta` context which is an arbitrary JSON object stored in the database that can be
updated through `updateCart`. It can store various configurations required for custom plugins. This could
be anything. If your checkout process involves an additional `comment` input field for example, that
comment could be passed as meta context. Because this information is accessible by payment and delivery
providers, available payment methods can be made dependendent on that data.

## Payment Provider configuration

If you want to show available payment options, use `Order.supportedPaymentProvider` of a cart to get a
list of payment providers available for that cart and `Order.payment` to get the current payment option
set on the cart.

`Order.supportedPaymentProviders` uses the service `supportedPaymentProviders` which determines all valid
payment providers for that specific cart like that:

1. Gets all active Payment Providers configured
2. Filters and sorts the found providers by `filterSupportedProviders` customizable through the platform
   configuration

To determine the default payment provider for initial carts, `determineDefaultProvider` platform settings
function is used.

```graphql
query {
  me {
    cart {
      payment {
        provider {
          _id
        }
      }
      supportedPaymentProviders {
        _id
      }
    }
  }
}
```

By using `Mutation.updateCart` you can change the active payment provider for that order (input parameter
`paymentProviderId`).

To set payment provider related options, use `Mutation.updateCartPaymentInvoice` or `Mutation.updateCartPaymentGeneric`.

## Delivery Provider configuration

If you want to show available delivery options, use `Order.supportedDeliveryProvider` of a cart to get a
list of delivery providers available for that cart and `Order.delivery` to get the current delivery
option set on the cart.

`Order.supportedDeliveryProviders` uses the service `supportedDeliveryProviders` which determines all
valid delivery providers for that specific cart like that:

1. Gets all active delivery providers configured
2. Filters and sorts the found providers by `filterSupportedProviders` customizable through the platform
   configuration

To determine the default delivery provider for initial carts, `determineDefaultProvider` platform
settings function is used.

```graphql
query {
  me {
    cart {
      delivery {
        provider {
          _id
        }
      }
      supportedDeliveryProviders {
        _id
      }
    }
  }
}
```

By using `Mutation.updateCart` you can change the active delivery provider for that order (input
parameter `deliveryProviderId`).

To set delivery provider related options, use `Mutation.updateCartDeliveryPickUp` or
`Mutation.updateCartDeliveryShipping`. Pick up providers usually want a pickup location, shipping
providers usually want to know an address to ship a parcel to.

## Discounts

TBD

## Order Positions

In Unchained, you can add products (`Mutation.addCartProduct`) and quotations
(`Mutation.addCartQuotation`) to carts, but only products will remain in the cart in the end. When adding
products to the cart, they are transformed according to the following rules:

**Products:**

- Adding a SimpleProduct or BundleProduct adds the product to the cart without transformation.
- Adding a ConfigurableProduct resolves to a concrete product if enough variation parameters are
  provided. Otherwise, the operation fails. The variation configuration is stored on the resolved item
  along with user-provided parameters.

When one product leads to another, the source productId is saved in `orderPosition.originalProductId`,
maintaining a reference for UX purposes.

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

With every cart mutation, Unchained Engine recomputes the cart in those steps:

