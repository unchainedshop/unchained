---
sidebar_position: 7
title: Orders Module
sidebar_label: Orders
description: Order lifecycle and cart management
---

# Orders Module

The orders module manages the order lifecycle, cart operations, and checkout process.

## Configuration Options

```typescript
export interface OrderSettingsOrderPositionValidation {
  order: Order;
  product: Product;
  quantityDiff?: number;
  configuration?: { key: string; value: string }[];
}

export interface OrdersSettingsOptions {
  ensureUserHasCart?: boolean;
  orderNumberHashFn?: (order: Order, index: number) => string;
  validateOrderPosition?: (
    validationParams: OrderSettingsOrderPositionValidation,
    unchainedAPI: UnchainedAPI,
  ) => Promise<void>;
  lockOrderDuringCheckout?: boolean;
}
```

- `ensureUserHasCart`: If enabled, Unchained will try to pre-generate a new cart when a user does not have one on various occasions, it's still not guaranteed that a user always has a cart. (default: false)
- `lockOrderDuringCheckout`: If enabled, Unchained tries to use a so-called "Distributed Locking" approach with MongoDB while the checkout process is running, highly encouraged for most cases (default: true)

### Order Number Creation

The `orderNumberHashFn` is used to generate human-readable codes that can be easily spelled out to support staff. The default is a hashids based function that generates an alphanumeric uppercase string with length 6 without the hard to distinguish 0IOl etc. If the number has already been taken, the function gets iteratively called with an increasing `index`.

[Default Random Hash Generator](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/generate-random-hash.ts)

### Order Position Validation

When users mutate their cart, you sometimes have cases where you want custom checks. For example you want to restrict users to only buy 4 tickets in one go despite having a stock of 100 tickets.

With `validateOrderPosition` you can validate cart manipulations and throw Errors that bubble through to the client.

**The default validator checks if a product is active.**

```typescript
const options = {
  modules: {
    orders: {
      orderNumberHashFn: (order, index) => order.sequence + 100000 + index,
      validateOrderPosition: async ({ order, product, quantityDiff, configuration }, context) => {
        const justOneAtATime = product.tags?.includes('one-at-a-time');
        const positions = await context.modules.orders.positions.findOrderPositions({
          orderId: order._id,
        });
        const userAlreadyHasProductInPositions = positions.some((p) => p.productId === product._id);
        if (justOneAtATime && userAlreadyHasProductInPositions && quantityDiff > 0) {
          throw new Error('ONE_AT_A_TIME');
        }
      },
    },
  },
};
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ORDER_CREATE` | `{ order }` | Emitted when an order is created |
| `ORDER_UPDATE` | `{ order, field }` | Emitted when an order is updated |
| `ORDER_REMOVE` | `{ orderId }` | Emitted when an order is removed |
| `ORDER_CHECKOUT` | `{ order, oldStatus }` | Emitted when checkout is initiated |
| `ORDER_CONFIRMED` | `{ order, oldStatus }` | Emitted when an order is confirmed |
| `ORDER_FULLFILLED` | `{ order, oldStatus }` | Emitted when an order is fulfilled |
| `ORDER_REJECTED` | `{ order, oldStatus }` | Emitted when an order is rejected |
| `ORDER_ADD_PRODUCT` | `{ orderPosition }` | Emitted when a product is added to cart |
| `ORDER_UPDATE_CART_ITEM` | `{ orderPosition }` | Emitted when a cart item is updated |
| `ORDER_REMOVE_CART_ITEM` | `{ orderPosition }` | Emitted when a cart item is removed |
| `ORDER_EMPTY_CART` | `{ orderId, count }` | Emitted when cart is emptied |
| `ORDER_SET_DELIVERY_PROVIDER` | `{ order }` | Emitted when delivery provider is set |
| `ORDER_SET_PAYMENT_PROVIDER` | `{ order }` | Emitted when payment provider is set |
| `ORDER_UPDATE_DELIVERY` | `{ orderDelivery }` | Emitted when delivery is updated |
| `ORDER_DELIVER` | `{ orderDelivery }` | Emitted when order is delivered |
| `ORDER_CREATE_DISCOUNT` | `{ discount }` | Emitted when a discount is created |
| `ORDER_UPDATE_DISCOUNT` | `{ discount }` | Emitted when a discount is updated |
| `ORDER_REMOVE_DISCOUNT` | `{ discount }` | Emitted when a discount is removed |

## More Information

For API usage and detailed documentation, see the [core-orders package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-orders).
