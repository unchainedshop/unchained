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
- modules: Core Module specific configuration (see next pages)

Other options are forwarded to the Apollo Engine, the available options are documented here: https://www.apollographql.com/docs/apollo-server

*******
The platfrom starts with
```bass
startPlatform()
````
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
### options

with options you can configure the platform with following keys

On [Account](./accounts.md) module

- `mergeUserCartsOnLogin`: a boolean with default value `true`
- `autoMessagingAfterUserCreation`: a boolean with default value `true`
- `server = {}`
- `password = {}`

On [Assortments](./assortments.md) module

- `setCachedProductIds`: function with `assortmentId` and `productIds` input returns a number promise
- `getCachedProductIds`: a function with `filterId` input
- `zipTree`: a function with `data` input returns a array of string
- `slugify`: a function with `title` input returns a string

On [Delivery](./delivery.md) module 

- `sortProviders`: with default `undefined` a function with two input payment providers `a` and `b` returns number 
- `filterSupportedProviders`: a function with `params` and `context` inputs returns promise of array of `DeliveryProvider`
- `determineDefaultProvider`: a function with `params` and `context` inputs returns promise of  `DeliveryProvider`

On [Enrollments](./enrollments.md) module

-  `autoSchedulingSchedule`: array of object
-  `autoSchedulingInput`: a function
-  `enrollmentNumberHashFn`: function with two inputs `enrollment` and `index` returns string

On [Files](./files.md) module 

-  `transformUrl`: function with two inputs `url` and `params` of object return string

On [Filters](./filters.md) module 

-  `setCachedProductIds`: a function with `filterId`, `productIds` and `productIdsMap` input returns a number promise
-  `getCachedProductIds`: a function with `filterId` input 
-  `skipInvalidationOnStartup`: boolean with default `false`

On [Orders](./orders.md) module

-  `ensureUserHasCart`: a boolean with default false
-  `orderNumberHashFn`: a function with `order` and `index` input
-  `validateOrderPosition`: a function with `validationParams` and `context` input

On [Payment](./payment.md) module 

-  `sortProviders`: with default `undefined` a function with two input payment providers `a` and `b` returns number
-  `filterSupportedProviders`: 
-  `determineDefaultProvider`:

On [Quotations](./quotations.md) module

- `quotationNumberHashFn`: a function with with `quotation` and `index` input returns string

# Enable Controlpanel

1. Add @unchainedshop/controlpanel as dependency (`npm install @unchainedshop/controlpanel`)

2. Use the embedControlpanelInMeteorWebApp function after startPlatform

```
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

Meteor.startup(() => {
  embedControlpanelInMeteorWebApp(WebApp);
});
```
