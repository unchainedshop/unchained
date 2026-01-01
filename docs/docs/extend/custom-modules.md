---
sidebar_position: 3
sidebar_label: Custom Modules
title: Write Custom Modules
description: Configure custom modules and services
---

# Custom Modules

There might be cases where the out of the box functionalities are not enough to solve a particular problem.

Custom Modules enables the developer to add additional functionality to the core engine. A module typically accesses the database using Drizzle ORM to read and write data, but it could also provide an interface to some external API that needs to be called from plugins or custom GraphQL resolvers.

In many cases this goes together with [extending the API](./graphql) to include additional mutations and queries that access the module's functions.

Below is an example of a custom module that will be used to change currency of a cart.

```typescript
import { eq, type DrizzleDb } from '@unchainedshop/store';
import { orders, rowToOrder } from '@unchainedshop/core-orders/db';
import { ModuleInput } from '@unchainedshop/core';

const myModule = {
  configure: async ({ db }: ModuleInput<Record<string, never>>) => {
    return {
      async changeCartCurrency(currencyCode: string, cartId: string) {
        await db.update(orders)
          .set({ currencyCode })
          .where(eq(orders._id, cartId));

        const [row] = await db.select().from(orders)
          .where(eq(orders._id, cartId))
          .limit(1);

        return row ? rowToOrder(row) : null;
      },
    };
  },
};
```

Let's go through the code line by line

1. Imported the Drizzle utilities (`eq`, `DrizzleDb`) from `@unchainedshop/store` and the orders schema
2. Added type for our custom module. In this case our module only contains single function `changeCartCurrency`
3. Defined the actual module by creating object with `configure` function as it's only key. Returns an object with key-value pairs that match the module type definition. Since our custom module has only one property, configure function should return an object with the exact property mapping.

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

Services allow you to add utility functions that can be used throughout the engine context in a similar fashion to modules. The difference between a service and a module usually is that a service doesn't have direct DB access but composes multiple module calls through the unchained context.

You can access built in or custom services from unchained context anywhere in the application like so:

```typescript
unchainedAPIContext.services.serviceName.[function name]
```

It is possible to create a custom service for your need and have it available throughout the engine context like the built-in services. Custom services function are bound to the core modules and have access to those through this.

```typescript
import { Modules } from '@unchainedshop/core';

function serviceFunc(this: Modules, ...myParams: any) {
  ...
  this.orders.findOrder(...)
}
``` 