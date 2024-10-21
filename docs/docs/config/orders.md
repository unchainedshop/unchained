---
sidebar_position: 7
title: Orders
sidebar_label: Orders 
---
# Orders
:::
Configure the Orders Module
:::



- ensureUserHasCart: `boolean` if set to true, Unchained will try to pre-generate a new cart when a user does not have one on various occasions, it's still not guaranteed that a user always has a cart. default is false
- orderNumberHashFn: `(order: Order, try: int) => string | number` function to retrieve a unique generated orderNumber, default is a hashids based function that generates an alphanumeric uppercase string with length 6. If the number has already been taken, the function gets iteratively called with an increasing `try`
- validateOrderPosition: `(validationParams: OrderSettingsOrderPositionValidation, context: UnchainedCore) => Promise<void>`. The default validator checks if a product is active.

Example custom configuration:

```
const options = {
  modules: {
    orders: {
      ensureUserHasCart: true,
      orderNumberHashFn: (order, try) => (order.sequence + 100000 + try),
      validateOrderPosition: async ({ order, product, quantityDiff, configuration }, context) => {},
    },
  }
};
```

For more on Order module read the **[API]**

