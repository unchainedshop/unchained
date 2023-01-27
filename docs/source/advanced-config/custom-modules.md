---
title: 'Modules'
description: Configure custom module
---

The unchained engine has several modules with out-of-the-box functionalities. The developer can use this with default configuration or minimum configuration.

The modules can be extended with your additional functionality to the core engine for out-of-the-box solution where the out-of-the-box functionalities do not solve a particular problem. In such cases it is possible to add a custom module that will be available throughout the engine context just like the built-in modules.

Below is an example custom module that will be used to change currency of a cart after creation.

```
import { OrdersCollection } from '@unchainedshop/core-orders';
import { generateDbFilterById } from '@unchainedshop/utils';
type CurrencyModule = {
    changeCartCurrency: (currency: string, cartId: string) =>  Promise<Order>
};
  
const currencyModule = {
  configure: async ({ db }: { db: Db }): Promise<CurrencyModule> => {
    const Orders = await OrdersCollection(db);

    return {
      async changeCartCurrency(currency, cartId) {
        const selector = generateDbFilterById(cartId);
        Orders.updateOne(selector, {
          $set: {
            currency,
            context: { currency },
          },
        });

        return Orders.findOne({ _id: cartId });
      },
    };
  },
};

```

```
startPlatform({
    ...
    modules: {
      ...
      currencyModule
      ...
    }, 
    ...
  })


```
