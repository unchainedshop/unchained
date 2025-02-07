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
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
```

Add

```js
import cookie from "cookie";
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
```

Change startPlatform from:

```js
const engine = await startPlatform({
    introspection: true,
    cache,
    plugins: [
        // Install a landing page plugin based on NODE_ENV
        ApolloServerPluginCacheControl({ calculateHttpHeaders: false }),
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
  options: {
    users: {
      autoMessagingAfterUserCreation: false
    }
  }
});
connect(app, engine);
connectDefaultPluginsToExpress(app, engine);

```

## Remove types

Remove all imports from `@unchainedshop/types` and find the types in the according core modules, core and
platform.


## Removed Module Functions

`modules.products.prices.userPrice` => `services.products.simulateProductPricing`

`modules.orders.pricingSheet` =>
```ts
import { OrderPricingSheet } from '@unchainedshop/core';
OrderPricingSheet(order);`
```

`modules.orders.positions.pricingSheet` =>
```ts
import { ProductPricingSheet } from '@unchainedshop/core';
ProductPricingSheet({
  ...item,
  currency: order.currency,
});`
```


`modules.orders.delivery.pricingSheet` =>
```ts
import { DeliveryPricingSheet } from '@unchainedshop/core';
DeliveryPricingSheet(delivery);`
```

`modules.orders.payment.pricingSheet` =>
```ts
import { PaymentPricingSheet } from '@unchainedshop/core';
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

`modules.orders.deliveries.activePickUpLocation` => 
```ts
const { orderPickUpLocationId } = orderDelivery.context || {};

const provider = await context.modules.delivery.findProvider({
  deliveryProviderId: orderDelivery.deliveryProviderId,
});
const director = await DeliveryDirector.actions(
  provider,
  { orderDelivery: orderDelivery },
  context,
);

const location = await director.pickUpLocationById(orderPickUpLocationId);
```

`modules.orders.payments.isBlockingOrderConfirmation` =>
```ts
if (orderPayment.status === OrderPaymentStatus.PAID) return false:
const provider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: orderPayment.paymentProviderId,
});
const actions = await PaymentDirector.actions(provider, {}, { modules });
return (!actions.isPayLaterAllowed())
```

`modules.messaging.renderToText` => Directly use literal strings or a templating library, for example [mustache](https://www.npmjs.com/package/mustache) or server-side React.

`modules.orders.checkout` => `services.orders.checkoutOrder`

`modules.ordes.initProviders` => 

## Changed Signatures

### modules.orders.positions.addProductItem

Thew argument got merged and instead of passsing objects you now only need to pass id's.

```ts
const orderPosition = await modules.orders.positions.addProductItem({
    quantity,
    configuration,
    productId: product._id,
    originalProductId: product._id, // or originalProduct._id if available,
    orderId: order._id,
  });
```

Additionally, the module function does not resolve a ConfigurableProduct to the correct SimpleProduct if a configuration is passed. If you need that function, use:
```ts
const product = await modules.products.resolveOrderableProduct(originalProduct, { configuration });
```


## Move away from registerLoginHandlers

Thus the accounts package doesn't exist anymore, if you need custom login, just implement your own mutation and do the checks there and then call `context.login(user)`

The special account events have been migrated too. For account specific topics there is now general events you can subscribe to:

- `USER_UPDATE_PASSWORD`
- `USER_ACCOUNT_ACTION`

