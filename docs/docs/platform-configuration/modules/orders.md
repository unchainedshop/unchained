---
sidebar_position: 7
title: Orders
sidebar_label: Orders 
---

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

- ensureUserHasCart: If enabled, Unchained will try to pre-generate a new cart when a user does not have one on various occasions, it's still not guaranteed that a user always has a cart. (default: false)
- lockorderDuringCheckout: If enabled, Unchained tries to use a so-called "Distributed Locking" approach with the MongoDB while the checkout process is running, highly encouraged for most cases (default: true)


### Order Number Creation

The `orderNumberHashFn` is used to generate human-readble codes that can be easily spelled out to support staff. The default is a hashids based function that generates an alphanumeric uppercase string with length 6 without the hard to distinguish 0IOl etc. If the number has already been taken, the function gets iteratively called with an increasing `index`.

[Default Random Hash Generator](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/generate-random-hash.ts)


### Order Position Validation

When users mutate their cart, you sometimes have cases where you want custom checks. For example you want to restrict users to only buy 4 tickets in one go despite having a stock of 100 tickets.

With `validateOrderPosition` you can validate cart manipulations and throw Errors that bubble through to the client.

**The default validator checks if a product is active.**

```typescript
const options = {
  modules: {
    orders: {
      orderNumberHashFn: (order, try) => (order.sequence + 100000 + try),
      validateOrderPosition: async ({ order, product, quantityDiff, configuration }, context) => {
        const justOneAtATime = product.tags?.includes("one-at-a-time")
        const positions = await context.modules.orders.positions.findOrderPositions({ orderId: order._id })
        const userAlreadyHasProductInPositions = positions.some(p => p.productId === product._id);
        if (justOneAtATime && userAlreadyHasProductInPositions && quantityDiff > 0) {
          throw new Error("ONE_AT_A_TIME")
        }
      },
    },
  }
};
```
