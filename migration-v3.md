# Migration Guide v2 -> v3

Add the env `UNCHAINED_TOKEN_SECRET`, use any random string secret to the server.

## Schema Changes

Checkout the Changelog for a list. We encourage you to use codegen to have statically typed queries and
mutations for frontend projects.

## Apollo to Yoga

Boot.ts files need to be migrated in order to work with the new Yoga GraphQL Server.

First: Dependencies `npm install @graphql-yoga/plugin-response-cache graphql-yoga cookie`
`npm uninstall @apollo/server-plugin-response-cache @apollo/server apollo-graphiql-playground`

Remove

```js
import {
  startPlatform,
  withAccessToken,
  setAccessToken,
  connectPlatformToExpress4,
} from '@unchainedshop/platform';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageGraphiQLPlayground } from 'apollo-graphiql-playground';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
```

Add

```js
import cookie from "cookie";
import { useExecutionCancellation } from 'graphql-yoga';
import { useResponseCache } from '@graphql-yoga/plugin-response-cache';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
```

Change startPlatform from:

```js
const engine = await startPlatform({
    introspection: true,
    cache,
    plugins: [
        // Install a landing page plugin based on NODE_ENV
        ApolloServerPluginCacheControl({ calculateHttpHeaders: false }),
        responseCachePlugin({...}),
        ApolloServerPluginDrainHttpServer({ httpServer }),
        ApolloServerPluginLandingPageGraphiQLPlayground({
            shouldPersistHeaders: true,
        }),
    ],
    options: {
        accounts: {
            autoMessagingAfterUserCreation: false,
            server: {
                loginExpirationInDays: 180,
            }
        },
    },
    context: withAccessToken(),
});

await engine.apolloGraphQLServer.start();
connectPlatformToExpress4(app, engine, { corsOrigins: [] });
```

to:

```js
const engine = await startPlatform({
  plugins: [
    useExecutionCancellation(),
    useResponseCache({
      ttl: 0,
      session(req) {
        const auth = req.headers.get('authorization');
        const cookies = cookie.parse(req.headers.get('cookie') || '');
        return auth || cookies[process.env.UNCHAINED_COOKIE_NAME] || null;
      },
      enabled() {
        return process.env.NODE_ENV === 'production';
      },
    }),
  ],
});
connect(app, engine);
```

## Remove types

Remove all imports from `@unchainedshop/types` and find the types in the according core modules, core and
platform.


## Removed Module Functions

`modules.products.prices.userPrice`: `services.products.simulateProductPricing`

`modules.orders.pricingSheet`:
```js
OrderPricingSheet(order);`
```

`modules.orders.positions.pricingSheet`:
```js
ProductPricingSheet({
  ...item,
  currency: order.currency,
});`
```

`modules.orders.delivery.pricingSheet`:
```js
DeliveryPricingSheet(delivery);`
```

`modules.orders.payment.pricingSheet`:
```js
PaymentPricingSheet(payment);`
```

`modules.accounts.findUserByEmail` => `modules.users.findUserByEmail`

`modules.accounts.setUsername` => `modules.users.setUsername`

`modules.accounts.createUser` => `modules.users.createUser` (password does not take a hashed password
anymore, provide plain password here it will hash it on it's own)

`modules.accounts.sendEnrollmentEmail(...)` => `modules.users.sendResetPasswordEmail(..., true);`

`modules.users.delete` => `services.users.deleteUser`

`modules.files.getUrl(file...)` => `modules.files.normalizeUrl(file.url...`

`modules.filters.search.searchProducts` => `services.filters.searchProducts`

`modules.warehousing.estimatedDispatch` => `services.products.simulatedProductDispatching`

`modules.warehousing.estimatedStock` => `services.products.simulatedProductInventory`

`getOrderCart` => `services.orders.findOrInitCart`

## Move away from registerLoginHandlers

Thus the accounts package doesn't exist anymore, if you need custom login, just implement your own mutation and do the checks there and then call `context.login(user)`

The special account events have been migrated too. For account specific topics there is now general events you can subscribe to:

- `USER_UPDATE_PASSWORD`
- `USER_ACCOUNT_ACTION`

## Benchmarks

Dependency Hell:

Minimal v2 without optional and without dev (production setup):

- 449 Packages in node_modules
- 205M

Minimal v3 without optional and without dev (production setup):

- 245 Packages in node_modules
- 76M
