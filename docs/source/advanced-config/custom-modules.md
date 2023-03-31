---
title: 'Custom Modules'
description: Configure custom modules and services
---

Enables the developer to add additional functionality to the core engine. There might be cases where the out of the box functionalities are not enough to solve a particular problem. On such cases it is possible to add a custom module that will be available through out the engine context just like built in modules.
In most cases this goes together with [extending the schema](../advanced-config/extending-schema) to include additional mutations and queries with custom resolvers.

It accepts key-value pair where `key` is the module name and `value` is an object that has one field named `configure`.
configure function receives a single object `ModuleInput` as it's only argument just like any other build in module. this mean you can pass the custom module configuration option like you would with the built in modules and have the underling database available inside the module configuration as well as a migration.

Below is an example of a custom module that will be used to change currency of a cart after creation.

```typescript
import { OrdersCollection } from '@unchainedshop/core-orders'
import { generateDbFilterById } from '@unchainedshop/utils'
import { Order } from '@unchainedshop/types/orders.js';

type CurrencyModule = {
  changeCartCurrency: (currency: string, cartId: string) => Promise<Order>
}

const currencyModule = {
  configure: async ({ db }: { db: Db }): Promise<CurrencyModule> => {
    const Orders = await OrdersCollection(db)

    return {
      async changeCartCurrency(currency, cartId) {
        const selector = generateDbFilterById(cartId)
        Orders.updateOne(selector, {
          $set: {
            currency,
            context: { currency },
          },
        })

        return Orders.findOne({ _id: cartId })
      },
    }
  },
}
```

Let's go through the code line by line

1. Imported the modules and utility functions we want to use in the module (`OrdersCollection` & `generateDbFilterById`)
2. Added type for our custom module. in this case our module only contains single function `changeCartCurrency`
3. Defined the actual module by creating object with `configure` function as it's only key. returns an object with key-value pairs that match the module type definition. Since our custom module has only one property configure function should return an object with the exact property mapping.

After defining the custom module the final step is registering it to the platform and making it globally available for use just like the built in modules.

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

**Note: avoid giving the custom module a name that is identical to the built in module. this will replace the existing module and change result in runtime error**

Now the `currencyModule` is available globally though out the engine context and can be accessed as follows

```
  unchainedContext.modules.currencyModule.changeCartCurrency(...)

```

Read more about unchained context and how to access it in **Accessing Unchained Context**

#### Custom Service

Services allow you to add utility functions that can be used throughout the engine context in a similar fashion to modules. The difference between a service and a module usually is that a module doesn't have direct DB access but composes multiple module calls through the unchained context.

You can access built in or custom services from unchained context anywhere in the application like so:
```
unchainedAPIContext.services.serviceName.[function name]
```

It is possible to create a custom service for your need and have it available throughout the engine context like the built-in services. Custom services function can accept first arguments that will be used in the service and will also receive unchained context as there second argument

```
function serviceFunc(args: obj, context: UnchainedCore) {
  ...
}
``` 
