---
sidebar_position: 3
sidebar_label: Custom Modules
title: Write Custom Modules
description: Configure custom modules and services
---

# Custom Modules

Custom modules add functionality to the core engine. A module typically reads and writes MongoDB data, but it can also wrap an external API that plugins or custom GraphQL resolvers need to call.

In many cases this goes together with [extending the API](./graphql) to include additional mutations and queries that access the module's functions.

A module is an object with a single `configure` function. It receives a `ModuleInput` (`db`, `migrationRepository`, and per-module `options`) and returns the module's public functions:

```typescript
import { OrdersCollection, type Order } from '@unchainedshop/core-orders';
import { generateDbFilterById, type ModuleInput } from '@unchainedshop/mongodb';

const myModule = {
  configure: async ({ db }: ModuleInput<Record<string, never>>) => {
    const Orders = await OrdersCollection(db);

    return {
      async changeCartCurrency(currency: string, cartId: string): Promise<Order | null> {
        const selector = generateDbFilterById(cartId);
        await Orders.updateOne(selector, {
          $set: { currencyCode: currency },
        });
        return Orders.findOne({ _id: cartId });
      },
    };
  },
};
```

Register it with `startPlatform` to make it available alongside the built-in modules:

```typescript
import { startPlatform } from '@unchainedshop/platform';

await startPlatform({
  modules: {
    myModule,
  },
});
```

:::warning
Don't give a custom module the same name as a built-in module — it replaces the built-in one.
:::

The module is now available on the Unchained context everywhere modules are accessible (resolvers, services, plugins):

```typescript
await context.modules.myModule.changeCartCurrency('CHF', 'cart-id');
```

## Custom Services

Services are utility functions that compose multiple module calls instead of accessing the database directly. Service functions are bound to the core modules, which are accessible through `this`:

```typescript
import type { UnchainedCore } from '@unchainedshop/core';

async function countOrdersOfUser(this: UnchainedCore['modules'], userId: string) {
  return this.orders.count({ userId, includeCarts: false });
}
```

Register services via `startPlatform` and call them through the context:

```typescript
await startPlatform({
  services: {
    myService: { countOrdersOfUser },
  },
});

// anywhere with access to the Unchained context:
await context.services.myService.countOrdersOfUser('user-id');
```
