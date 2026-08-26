---
sidebar_position: 7
title: GraphQL API Reference
sidebar_label: GraphQL API
description: The high-traffic queries and mutations of the Unchained Engine GraphQL API
---

# GraphQL API Reference

Unchained Engine exposes its GraphQL API at `/graphql`, built with [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server).

:::tip Explore the full schema
This page only covers the high-traffic operations of a typical storefront flow. The **complete schema is self-documenting**: open `/graphql` of your running engine in a browser for the interactive GraphiQL explorer with auto-completion and inline docs, or use standard GraphQL introspection with your tool of choice.
:::

## Custom Scalars

| Scalar | Description |
|--------|-------------|
| `JSON` | Arbitrary JSON object |
| `DateTime` | ISO 8601 date-time string |
| `Date` | Date value |
| `Timestamp` | Milliseconds since UNIX epoch (integer) |
| `LowerCaseString` | String that enforces lowercase |
| `Locale` | BCP 47 locale code (e.g., `en`, `de-CH`) |
| `PhoneNumber` | Phone number string |

## Directives

### `@cacheControl`

Controls HTTP caching behavior for fields and types:

```graphql
directive @cacheControl(maxAge: Int, scope: CacheControlScope) on FIELD_DEFINITION | OBJECT
```

Scope values: `PUBLIC`, `PRIVATE`

## Conventions

- List queries take `limit`, `offset`, and `sort: [SortOptionInput!]` and have a matching `...Count` query (`products`/`productsCount`, `orders`/`ordersCount`, ...).
- Cart mutations take an optional `orderId`. If omitted, they operate on the current user's active cart.
- Login-style mutations return a `LoginMethodResponse` (`_id`, `tokenExpires`, `user`) — the session JWT is set as an HTTP-only cookie, see [Authentication](./authentication.md).

## Authentication

```graphql
mutation LoginAsGuest {
  loginAsGuest {
    _id
    tokenExpires
  }
}
```

```graphql
mutation Login {
  loginWithPassword(email: "user@example.com", password: "securepassword") {
    _id
    tokenExpires
  }
}
```

All strategies (email/password, WebAuthn, OIDC, access tokens) are covered in [Authentication](./authentication.md).

## Browse & Search Products

| Operation | Arguments | Description |
|-----------|-----------|-------------|
| `product` | `productId: ID`, `slug: String` | Get product by ID or slug |
| `products` | `queryString`, `tags`, `slugs`, `limit = 10`, `offset = 0`, `includeDrafts = false`, `sort` | List published products |
| `productsCount` | `tags`, `slugs`, `includeDrafts`, `queryString` | Count products |
| `searchProducts` | `queryString`, `filterQuery`, `assortmentId`, `orderBy`, `includeInactive = false`, `ignoreChildAssortments = false` | Faceted search, returns `ProductSearchResult` |
| `assortment` | `assortmentId: ID`, `slug: String` | Get assortment (category) by ID or slug |

```graphql
query Search {
  searchProducts(queryString: "shirt", filterQuery: [{ key: "color", value: "red" }]) {
    filteredProductsCount
    filters {
      definition {
        _id
      }
    }
    products(limit: 10) {
      _id
      texts {
        title
        slug
      }
      ... on SimpleProduct {
        simulatedPrice {
          amount
          currencyCode
        }
      }
    }
  }
}
```

`texts`, `media`, `reviews`, and `assortmentPaths` live on the `Product` interface; prices (`catalogPrice`, `simulatedPrice`) are declared on the concrete types (`SimpleProduct`, `PlanProduct`, `BundleProduct`, `TokenizedProduct`) and need inline fragments.

## Build a Cart

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `addCartProduct` | `orderId`, `productId!`, `quantity = 1`, `configuration` | Add product (creates cart if needed) |
| `addMultipleCartProducts` | `orderId`, `items!` | Add multiple products |
| `updateCartItem` | `itemId!`, `quantity`, `configuration` | Change quantity/configuration |
| `removeCartItem` | `itemId: ID!` | Remove item |
| `emptyCart` | `orderId` | Remove all items |
| `addCartDiscount` | `orderId`, `code!` | Apply discount code |
| `removeCartDiscount` | `discountId: ID!` | Remove discount |
| `updateCart` | `orderId`, `billingAddress`, `contact`, `meta`, `paymentProviderId`, `deliveryProviderId` | Set address, contact, providers |
| `updateCartDeliveryShipping` | `orderId`, `deliveryProviderId!`, `address`, `meta` | Configure shipping delivery |
| `updateCartDeliveryPickUp` | `orderId`, `deliveryProviderId!`, `orderPickUpLocationId!`, `meta` | Configure pickup delivery |
| `updateCartPaymentInvoice` | `orderId`, `paymentProviderId!`, `meta` | Configure invoice payment |
| `updateCartPaymentGeneric` | `orderId`, `paymentProviderId!`, `meta` | Configure generic (gateway) payment |

```graphql
mutation AddToCart {
  addCartProduct(productId: "product-id", quantity: 2) {
    _id
    quantity
    total {
      amount
      currencyCode
    }
  }
}
```

```graphql
mutation SetCheckoutDetails {
  updateCart(
    billingAddress: { firstName: "John", lastName: "Doe", addressLine: "Main St 1", postalCode: "8000", city: "Zurich" }
    contact: { emailAddress: "user@example.com" }
    paymentProviderId: "payment-provider-id"
    deliveryProviderId: "delivery-provider-id"
  ) {
    _id
    total {
      amount
      currencyCode
    }
  }
}
```

## Checkout

For gateway payments (Stripe, Datatrans, ...), first sign the order payment with the provider — the returned string is the provider-specific payload for the client SDK:

```graphql
mutation Sign {
  signPaymentProviderForCheckout(transactionContext: {})
}
```

Then check out — the cart becomes an order, charging and delivery are triggered automatically where possible:

```graphql
mutation Checkout {
  checkoutCart(paymentContext: {}) {
    _id
    orderNumber
    status
  }
}
```

`checkoutCart(orderId: ID, paymentContext: JSON, deliveryContext: JSON): Order!` — the contexts are passed through to the payment/delivery plugins.

## Current User & Orders

```graphql
query Me {
  me {
    _id
    primaryEmail {
      address
    }
    cart {
      _id
      items {
        _id
        quantity
      }
      total {
        amount
        currencyCode
      }
    }
    orders(includeCarts: false) {
      _id
      orderNumber
      status
    }
  }
}
```

Administrators can list all orders with `orders(limit, offset, includeCarts, queryString, status, sort, paymentProviderIds, deliveryProviderIds, dateRange)` and fetch a single one with `order(orderId: ID!)`.

## Related

- [Authentication](./authentication.md) - Sessions, login mutations, tokens
- [Permissions Reference](./permissions.md) - Which role may call which operation
- [Extend the GraphQL API](../extend/graphql.md) - Add custom types and resolvers
- [Architecture](./architecture.md) - System architecture
