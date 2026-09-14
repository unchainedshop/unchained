---
sidebar_position: 3
sidebar_label: Custom Modules
title: Write Custom Modules
description: Configure custom modules and services
---

# Custom Modules

There might be cases where the out of the box functionalities are not enough to solve a particular problem.

Custom Modules enables the developer to add additional functionality to the core engine. A module typically accesses the MongoDB to read and write data from and to the database but it could also provide an interface to some external API that needs to be called from plugins or custom GraphQL resolvers.

In many cases this goes together with [extending the API](./graphql) to include additional mutations and queries that access the module's functions.

Below is a low-level module example that updates an order's currency field. Application code must validate the cart and currency and recalculate its pricing before checkout.

```typescript
import { OrdersCollection } from '@unchainedshop/core-orders'
import { generateDbFilterById, type ModuleInput } from '@unchainedshop/mongodb';

const myModule = {
  configure: async ({ db }: ModuleInput<Record<string, never>>) => {
    const Orders = await OrdersCollection(db)

    return {
      async changeCartCurrency(currencyCode: string, cartId: string) {
        const selector = generateDbFilterById(cartId)
        await Orders.updateOne(selector, {
          $set: {
            currencyCode,
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
      myModule
      ...
    },
    ...
  })
```

**Note: avoid giving the custom module a name that is identical to the built in module. this will replace the existing module and change result in runtime error**

Now the `myModule` is available globally though out the engine context and can be accessed as follows

```
  unchainedContext.modules.myModule.changeCartCurrency(...)

```

Read more about unchained context and how to access it in **Accessing Unchained Context**

#### Custom Service

Services allow you to add utility functions that can be used throughout the engine context in a similar fashion to modules. The difference between a service and a module is that a service does not access the database directly but composes multiple module calls through the unchained context.

You can access built in or custom services from unchained context anywhere in the application like so:

```typescript
unchainedAPIContext.services.custom.findOrder(orderId)
```

It is possible to create a custom service for your need and have it available throughout the engine context like the built-in services. Custom services function are bound to the core modules and have access to those through this.

```typescript
import type { UnchainedCore } from '@unchainedshop/core';

async function findOrder(this: UnchainedCore['modules'], orderId: string) {
  return this.orders.findOrder({ orderId });
}
``` 