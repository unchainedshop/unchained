---
title: 'Overview'
---

The unchained engine has several modules with out the box functionalities. The developer can the use this with default configuration or minimum configuration.

The modules can be extended with your additional functionality to the core engine for out of the box solution where the out of the box functionalities is not solve a particular problem. On such cases it is possible to add a custom module that will be available through out the engine context just like the built in modules.

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