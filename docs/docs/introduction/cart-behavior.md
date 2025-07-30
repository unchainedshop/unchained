---
sidebar_position: 2
title: Orders and Carts
description: Learn about how carts and orders work
sidebar_label: Orders and Carts
---

# Orders and Carts

## Fulfilmment Process

The fulfilment process in Unchained Engine involves several key steps to ensure that orders are processed efficiently and accurately. This document provides a high-level overview of the process.

## Order Processor

:::note Locking
Unchained uses "Distributed Locking" during checkout, order confirmation and order rejection. All of those services trigger the order processor state machine.
:::

:::note State Persistence
Every time the order processor persists an order status in the DB (think "auto-save" in games), order status notification messages are triggered asynchronously. If it does not persist, the status is in memory.
:::

### `OPEN` (Cart)

An Order starts it's life with a status of `null` indicating it's a cart. A cart always has a userId, thus when a client wants to add something to a cart through the GraphQL API, the user has to be either logged in or have used `Mutation.loginAsGuest` to start a guest user session.

Carts by default only exist when at least one cart mutation has been called (created and re-used on demand), before that `Query.me.cart` is `null`. This behavior can be customized.

With every cart mutation, prices and delivery dates get re-calculated. Reading a cart is side-effect free. More about this topic can be read further below.

### `OPEN` => `PENDING` (Checkout)

Order checkout is usually called directly from payment plugin webhooks server-to-server. In error-ish cases, you might want to call the method on the client too to analyze errors that happened during the checkout.

When a checkout is initiated, in a first step the order gets validated. This is done by a few checks:
1. Order has a payment provider set
2. Order has a delivery provider set
3. At least one order position present
4. Checks every order position by calling `validateOrderPosition` which can be customized by providing an own implementation through the platform settings for orders. By default it just checks if the product is still active.
5. If the order position is a quotation proposal, we additionally ask the Quotation plugin in charge if the proposal is still valid.

The Order validation step **DOES NOT** recalculate the order, so prices and delivery dates could have been changed since the last cart mutation. If you need such behavior, throw an Error in `validateOrderPosition` and let the client application fix the problem.

With all checks complete, the order goes into status `PENDING` but as an in-flight status that is not yet persisted in the database.

### `PENDING` => `CONFIRMED` (Confirmation)

The system now proceeds with payment. It hands this over to the `PaymentDirector` which first tries to charge with an order-assigned payment provider.

If the plugin **throws an error**, the whole checkout gets interrupted and the order stays in status `OPEN`. This can be helpful if for example a credit card got declined and you don't want to allow the checkout to go further.

If the payment provider is not successful (`charge()` returns `false`) but doesn't throw an error, Unchained will assume that it could for some reason be okay to have this order continue in the process without a payment.

A successful charge means the payment has been done or the payment has been done already and is still valid.

Unchained then asks both the delivery and the payment plugin if it is allowed to automatically confirm the order.

:::info
A post-paid invoice plugin for example would usually not block order confirmation because it's fine to let it deliver without payment so it returns  `true` in the payment adapter's `isPayLaterAllowed`.

A pay by invoice pre-paid plugin would usually block the order confirmation.
:::

If order confirmation is blocked, checkout ends here and the cart transitions to a persisted order with status `PENDING` waiting for events or manual confirmation to proceed.

If an order confirmation is not beeing blocked by the plugins, Unchained will do some last actions:
1. Tell the payment plugin it can confirm the payment (payment could have been only reserved until now).
3. Finally, the order will go into status `CONFIRMED` and also persist this status in the db.
 
 ### `CONFIRMED` => `FULLFILLED` (Fullfilment)

The system now proceeds with delivery. It first hands this over to the `DeliveryDirector` which tries to initiate and complete delivery.

If the delivery plugin **throws an error**, the process get interrupted, checkouts would error and the order stays in status `CONFIRMED`.

If the delivery plugin is not successful (`send()` returns `false`), Unchained will assume that delivery is not complete yet.

No matter if the delivery is successful or not, next, Unchained will also iterate through all order positions and trigger follow-up actions:

- `WarehousingDirector` digitally instantiates (`tokenize`) order positions for TokenizedProduct.
- `EnrollmentDirector` creates enrollments (`transformOrderItemToEnrollment`) for PlanProducts.
- `QuotationDirector` marks linked quotations as fullfilled because the offer has been accepted through order fullfilment. 

After that Unchained checks if order delivery is `DELIVERED` and order payment is `PAID`. If that is the case, the order is persisted with the final status `FULLFILLED`, else it will stay `CONFIRMED`.

:::danger It's discouraged to write plugins that throw
If any of the above actions throw because of your own code in for ex. a `WarehousingAdapter`, the process gets interrupted in an unsupported state. Resolving that state needs custom code and deep knowledge about the inner workings! There is no standard API to retry those actions, triggering the Order Processor will not retry those actions either.

Make sure to build these actions in a way that is asynchronous and forgiving so that this step is not dependent on potentially unavailable resources.

If you want to send the order to an ERP system with your own delivery plugin for example, consider returning `false` and create a work queue item.
:::

# Cart Behavior

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
