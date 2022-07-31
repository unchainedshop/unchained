---
title: 'Boot up'
description: Start the Unchained Engine
---

# Platform Configuration

Setting up the Unchained Engine is simple:

Add @unchainedshop/platform to your unchained project, copy the dependencies part of the minimal example to your own project's package.json, then start the engine:

```
import { startPlatform } from '@unchainedshop/platform';

const unchainedApi = await startPlatform();
await unchainedApi.modules.accounts.createUser(
  {
    email: 'admin@unchained.local',
    guest: false,
    initialPassword: 'true',
    lastBillingAddress: {},
    password: hashPassword('admin'),
    profile: { address: {} },
    roles: ['admin'],
    username: 'admin',
  },
  { skipMessaging: true },
);
```

These options are available:

- corsOrigins: Array/Boolean (Determine if origin is fine for cors, set to true to reflect all origins in http responses)
- rolesOptions: Object (Roles configuration)
- mergeUserCartsOnLogin: Boolean (Enable/Disable merge mode of carts when user gets logged in)
- assignCartForUsers: boolean (Enable/Disable assigning carts for existing users on startup, default: `false`)
- invalidateProviders: boolean (Enable/Disable invalidating carts on startup, default: `true`)
- providerInvalidationMaxAgeDays: number (Set the max age for cart invalidation on startup, default: `30`)
- typeDefs: Object (GraphQL Schema that gets merged with the default schema)
- resolvers: Object (GraphQL Resolvers that get merged with the default API)
- modules: Custom modules configuration point. allows you to extends the functionality the engine.
- options: Configuration options used to change the default behavior of a module.

Other options are forwarded to the Apollo Engine, the available options are documented here: https://www.apollographql.com/docs/apollo-server

---

The platfrom starts with

```bass
startPlatform()
```

accepts the following object

```bash
{
   modules = {},
   services = {},
   typeDefs = [],
   resolvers = [],
   options = {},
   rolesOptions = {},
   expressApp,
   bulkImporter: bulkImporterOptions,
   schema,
   plugins,
   cache,
   workQueueOptions,
   context,
   introspection,
   playground,
   tracing,
   cacheControl,
   corsOrigins,
}
```

### Options

with options you can configure the platform with following keys

On [Account](./accounts) module

- `mergeUserCartsOnLogin`: a boolean with default value `true`
- `autoMessagingAfterUserCreation`: a boolean with default value `true`
- `server = {}`
- `password = {}`

On [Assortments](./assortments) module

- `setCachedProductIds`: function with `assortmentId` and `productIds` input returns a number promise
- `getCachedProductIds`: a function with `filterId` input
- `zipTree`: a function with `data` input returns a array of string
- `slugify`: a function with `title` input returns a string


On [Delivery](./delivery) module 

- `sortProviders`: with default `undefined` a function with two input payment providers `a` and `b` returns number
- `filterSupportedProviders`: a function with `params` and `context` inputs returns promise of array of `DeliveryProvider`
- `determineDefaultProvider`: a function with `params` and `context` inputs returns promise of `DeliveryProvider`

On [Enrollments](./enrollments) module

- `autoSchedulingSchedule`: array of object
- `autoSchedulingInput`: a function
- `enrollmentNumberHashFn`: function with two inputs `enrollment` and `index` returns string

On [Files](./files) module 

- `transformUrl`: function with two inputs `url` and `params` of object return string

On [Filters](./filters) module 

- `setCachedProductIds`: a function with `filterId`, `productIds` and `productIdsMap` input returns a number promise
- `getCachedProductIds`: a function with `filterId` input
- `skipInvalidationOnStartup`: boolean with default `false`

On [Orders](./orders) module

- `ensureUserHasCart`: a boolean with default false
- `orderNumberHashFn`: a function with `order` and `index` input
- `validateOrderPosition`: a function with `validationParams` and `context` input


On [Payment](./payment) module 
- `sortProviders`: with default `undefined` a function with two input payment providers `a` and `b` returns number
- `filterSupportedProviders`:
- `determineDefaultProvider`:

On [Quotations](./quotations) module

- `quotationNumberHashFn`: a function with with `quotation` and `index` input returns string

### Modules
Enables the developer to add additional functionality to the core engine. There might be cases where out of the box functionalities is not enough to solve a particular problem. On such cases it is possible to add a custom module that will be available through out the engine context just like built in modules. 
In most cases this goes together when [extending the schema](./extending-schema) to include additional mutations and queries with custom resolvers.

It accepts key-value pair where `key` is the module name and `value` is a object that has one field named `configure`.
configure function receives a single object `ModuleInput` as it's only argument just like any other build in module. this mean you can pass the custom module configuration option like you would with the built in modules, have the underling database available inside the module configuration as well as a migration.

Below is an example of a custom module that will be used to change currency of a cart after creation.

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

Let's go through the code line by line

1. Imported the modules and utility functions we want to use in the module (OrdersCollection & generateDbFilterById)
2. Added a type of the module. in this case our module only contains single function `changeCartCurrency`
3. Defined the actual module by creating an object with `configure` function as it's only key. returns an object with key-value pairs that match the module type definition. Since our custom module has only one property configure function should return an object with the exact property mapping.

After defining the custom module the final step is registering it to the engin and making it globally available for use just like the built in modules.

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

Now the `currencyModule` is available globally though out unchained context and can be access like below

```
  unchainedConte

  - CountryServices: In xt.modules.currencyModule.changeCartCurrency(...)

```

Read more about unchained context and how to access it in **Accessing Unchained Context**

### Services

The following services are available

- bookmarkServices: In bookmarkService, migrateBookmarksService function exists and accepts params: { `fromUser`, `toUser`,`shouldMerge` } and context which is { `modules`, `userId` }

- countryServices: In country services resolveDefaultCurrencyCode function exists and it is a function which accepts `params`: { isoCode } and context: { modules }

- fileServices: an object with following functions

  - linkFile: accepts `params`: { fileId, size, type } and `context`: { modules, userId },
  - createSignedURL: accepts `params`: { directoryName, fileName, meta, userId } and context: { modules }
  - createSignedURLuploadFileFromURL,
  - createSignedURLuploadFileFromStream,
  - removeFiles,

- orderServices:
  - migrateOrderCartsService: accepts `params`: { fromUser, toUser, shouldMerge } and requestContext: Context,
  - createUserCartService: accepts `params`: { user, orderNumber, countryCode } and `requestContext`: { countryContext, modules, services }
- paymentServices:
  - chargeService: accepts `params`: { paymentContext, paymentProviderId } and `context`: { modules, userId }
  - registerPaymentCredentialsService: accepts `paymentProviderId`, `paymentContext` and `context`: { modules, userId },
  - cancelService: accepts `params`: { paymentContext, paymentProviderId } and `context`: { modules, userId }
  - confirmService: accepts `params`: { paymentContext, paymentProviderId } and `context`: { modules, userId }
- productServices: removeProductService accepts `params`: { productId }, `context`: { modules, userId }
- userServices:
  - getUserCountryService: accepts `user`, `params`: { localeContext } and `context`: { modules }
  - getUserLanguageService: accepts `user`, `params`: { localeContext } and `context`: { modules }
  - getUserRoleActionsService: accepts `user` and `context`
  - updateUserAvatarAfterUploadService: accepts `params`: { file: File } and context: { modules, services, userId } 

# Enable Controlpanel

1. Add @unchainedshop/controlpanel as dependency (`npm install @unchainedshop/controlpanel`)

2. Use the embedControlpanelInMeteorWebApp function after startPlatform
