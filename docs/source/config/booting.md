---
title: 'Boot up'
description: Start the Unchained Engine
---
### Table of contents

- [Platform Configuration](#platform-configuration) 
- [Options](#options)
- [Modules](#modules)
- [Services](#services)
- [RoleOptions](#rolesoptions)
- [BulkImporter](#bulkimporter)
- [WorkQueueOptions](#workqueueoptions)
- [Controlpanel](#enable-controlpanel)
# Platform Configuration

Setting up the Unchained Engine is simple:

Add @unchainedshop/platform to your unchained project, copy the dependencies part of the minimal example to your own project's package.json, then start the engine:

```typescript
import { startPlatform } from '@unchainedshop/platform'

const unchainedApi = await startPlatform()
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
)
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

The platform starts with

```bash
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

- `sortProviders`: with default `undefined` a function with two input payment providers `a` and `b` returns number. This key is deprecated please use `filterSupportedProviders`
- `filterSupportedProviders`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of array of `DeliveryProvider`
- `determineDefaultProvider`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of `DeliveryProvider`

On [Enrollments](./enrollments) module

- `autoSchedulingSchedule`: array of object
- `autoSchedulingInput`: a function with default empty object
- `enrollmentNumberHashFn`: function with two inputs `enrollment` and `index` returns string

On [Files](./files) module

- `transformUrl`: function with two inputs `url` and [`params`](https://docs.unchained.shop/types/interfaces/files.FilesSettings.html#transformUrl) of object return string

On [Filters](./filters) module

- `setCachedProductIds`: a function with `filterId`, `productIds` and `productIdsMap` input returns a number promise
- `getCachedProductIds`: a function with `filterId` input
- `skipInvalidationOnStartup`: boolean with default `false`

On [Orders](./orders) module

- `ensureUserHasCart`: a boolean with default false
- `orderNumberHashFn`: a function with `order` and `index` input
- `validateOrderPosition`: a function with `validationParams` and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) input

On [Payment](./payment) module

- `sortProviders`: with default `undefined` a function with two input payment providers `a` and `b` returns number. This key is deprecated please use `filterSupportedProviders`
- `filterSupportedProviders`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of array of `PaymentProvider`
- `determineDefaultProvider`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of `PaymentProvider`

On [Quotations](./quotations) module

- `quotationNumberHashFn`: a function with with `quotation` and `index` input returns string

### Modules

Enables the developer to add additional functionality to the core engine. There might be cases where out of the box functionalities is not enough to solve a particular problem. On such cases it is possible to add a custom module that will be available through out the engine context just like built in modules.
In most cases this goes together when [extending the schema](./extending-schema) to include additional mutations and queries with custom resolvers.

It accepts key-value pair where `key` is the module name and `value` is a object that has one field named `configure`.
configure function receives a single object `ModuleInput` as it's only argument just like any other build in module. this mean you can pass the custom module configuration option like you would with the built in modules, have the underling database available inside the module configuration as well as a migration.

Below is an example of a custom module that will be used to change currency of a cart after creation.

```typescript
import { OrdersCollection } from '@unchainedshop/core-orders'
import { generateDbFilterById } from '@unchainedshop/utils'
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

- bookmarkServices: enables to manage bookmarks after login using `migrateBookmarksService`,
  - `migrateBookmarksService`: accepts `params`: { `fromUser`, `toUser`,`shouldMerge` } and `context` which is { `modules`, `userId` }

```typescript
 import { startPlatform } from "@unchainedshop/platform";

 const services = {
      bookmarks: {
        migrateBookmarks: async ({ fromUser, toUser, shouldMerge },{ modules, userId }) => {
          await modules.bookmarks.deleteByUserId(toUser._id, userId);
        },
      },
    }

 await startPlatform({
   ...,
    services,
   ...
 })
```

- countryServices: In country services resolveDefaultCurrencyCode function exists and it is a function which accepts `params`: { isoCode } and `context`: { modules } and set default currency

```typescript
 import { startPlatform } from "@unchainedshop/platform";

 const services = {
      countries: {
        resolveDefaultCurrencyCode: async ({ isoCode }, { modules }) => {
        },
      },
    }

 await startPlatform({
   ...,
    services,
   ...
 })
```

- fileServices: an object with following functions

  - linkFile: enables file to linked with user accepts `params`: { fileId, size, type } and `context`: { modules, userId },

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  files: {
    linkFile: async ({ fileId, size, type }, { modules, userId }) => {
      const file = await modules.files.findFile({ fileId });

      await modules.files.update(file._id, userId)
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})

```

- createSignedURL: returns signed file using file adaptor and accepts `params`: { directoryName, fileName, meta, userId } and `context`: { modules }

```typescript
import { startPlatform } from "@unchainedshop/platform";

 const services = {
      files: {
        createSignedURL: async ({ fileName, userId }, { modules }) => {
         },
      },
    }

 await startPlatform({
   ...,
    services,
   ...
 })
```

- uploadFileFromURL: enables to upload files from URL and accepts `params`: { directoryName, fileInput, meta, userId } and `context`: { modules }

```typescript
import { startPlatform } from "@unchainedshop/platform";

const services = {
  files: {
    uploadFileFromURL: async ({ fileInput, userId }, { modules }) => {
      const fileData = await fileUploadAdapter.uploadFileFromURL(fileInput);

      const fileId = await files.create(fileData, userId);
      },
    },
  }

 await startPlatform({
   ...,
    services,
   ...
 })
```

- uploadFileFromStream: enables to upload files and accepts `params`: { directoryName, rawFile, meta, userId } and `unchainedContext`: { modules }

```typescript
import { startPlatform } from "@unchainedshop/platform";

const services = {
  files: {
    uploadFileFromURL: async ({ fileInput, userId }, { modules }) => {
      const fileData = await fileUploadAdapter.uploadFileFromStream(rawFile);

      const fileId = await files.create(fileData, userId);
      },
    },
  }

 await startPlatform({
   ...,
    services,
   ...
 })
```

- removeFiles: remove files and accepts `params`: { fileIds }, `context`: { modules, userId }

```typescript
import { startPlatform } from "@unchainedshop/platform";

const services = {
  files: {
    removeFiles: async ({ fileIds }, { modules }) => {
      await files.deleteMany(fileIds, userId);
      },
    },
  }

 await startPlatform({
   ...,
    services,
   ...
 })
```

- orderServices: an object with following functions
  - migrateOrderCartsService: enables to migrate order cart and accepts `params`: { fromUser, toUser, shouldMerge } and `requestContext`,

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  orders: {
    migrateOrderCarts: async ({ fromUser, toUser, shouldMerge }, requestContext ) => {
      await requestContext.modules.orders.migrateCart({ fromCart, shouldMerge, toCart }, requestContext)
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})

```

- createUserCartService: accepts `params`: { user, orderNumber, countryCode } and `requestContext`: { countryContext, modules, services }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  orders: {
    createUserCartService: async ({ fromUser, toUser, shouldMerge }, requestContext ) => {
      await await modules.orders.create({orderNumber, countryCode}, user_id)
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- paymentServices: an object with following functions
  - chargeService: accepts `params`: { paymentContext, paymentProviderId } and `context`: { modules, userId }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  payment: {
    charge: async () => {},
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- registerPaymentCredentialsService: enables to register payment provider and accepts `paymentProviderId`, `paymentContext` and `context`: { modules, userId },

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  payment: {
    registerPaymentCredentials: async ( paymentProviderId, paymentContext, requestContext ) => {
      await modules.payment.paymentProviders.register(paymentProviderId, paymentContext, requestContext);
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- cancelService: enables cancel payment and accepts `params`: { paymentContext, paymentProviderId } and `context`: { modules, userId }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  payment: {
    cancel: async ({ paymentContext, paymentProviderId }, requestContext) => {
      await requestContext.modules.payment.paymentProviders.cancel(paymentProviderId, { ...paymentContext, requestContext.userId, paymentProviderId }, requestContext);
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- confirmService: enables cancel payment and accepts `params`: { paymentContext, paymentProviderId } and `context`: { modules, userId }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  payment: {
      confirm: async ({ paymentContext, paymentProviderId }, requestContext) => {
        await requestContext.modules.payment.paymentProviders.confirm(paymentProviderId, { ...paymentContext, requestContext.userId, paymentProviderId }, requestContext);
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- productServices: an object with `removeProductService` function which removes product and accepts `params`: { productId }, `context`: { modules, userId }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  products: {
      removeProductService: async ({ productId }, { modules, userId }) => {
        await modules.assortments.products.delete(productId);
        await modules.products.delete(productId, userId);
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- userServices: an object with following functions
  - getUserCountry: enables to get user country and accepts `user`, `params`: { localeContext } and `context`: { modules }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  users: {
      getUserCountry: async (user, { localeContext }, { modules }) => {
          const userLocale = modules.users.userLocale(user, params);

          return modules.countries.findCountry({ isoCode: userLocale.country.toUpperCase() });
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- getUserLanguage: enables to get user language and accepts `user`, `params`: { localeContext } and `context`: { modules }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  users: {
      getUserLanguage: async (user, { localeContext }, { modules }) => {
        const userLocale = modules.users.userLocale(user, params);

        return modules.languages.findLanguage({ isoCode: userLocale.language });
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- getUserRoleActions: accepts `user` and `context`

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  users: {
      getUserRoleActions: async ({ productId }, { modules, userId }) => {

    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

- updateUserAvatarAfterUpload: enables to update user avatar and accepts `params`: { file: File } and context: { modules, services, userId }

```typescript
import { startPlatform } from '@unchainedshop/platform'

const services = {
  users: {
      updateUserAvatarAfterUpload: async ({ file }, { modules, services, userId }) => {
        await modules.users.updateAvatar(userId, file._id, file.createdBy)
    },
  },
}

await startPlatform({
  ...,
  services,
  ...
})
```

**Note: You can also pass your own custom service but it must not be identical to the built in service name. this will replace the existing service and change result in runtime error**

```typescript
import { startPlatform } from '@unchainedshop/platform'

const customServices = {
  customService1: {
      // do something
    },
  customService2: {
      // do something else
    },
  },
}

await startPlatform({
  ...,
  services: {
    ...customServices
  },
  ...
})
```

### rolesOptions

`roleOptions` option enables you to customize the existing roles for an API and assign roles to new query and/or mutation resolvers you have created.
it expects an object with `additionalRoles` & `additionalActions` fields.

- `additionalRoles` an object with key defining the role name and value a function that will assign the appropriate role, it gets the global `Role` class as it's only argument to allow or deny access to default or custom actions registered on the engine.
- `additionalActions` array of custom action names you want to assign default or custom roles.

**You can access the built in roles, you can import it from @unchaiendshop/api**
below is a sample code that will demonstrate simple usage of customizing built in roles and adding custom roles.

```typescript
import { startPlatform } from "@unchainedshop/platform";
import { roles } from "@unchainedshop/api";

const customActions = {
  buyTicket: "buyTicket",
  requestRefund: "requestRefund",
}

roles.allRoles.ADMIN.allow(customActions.buyTicket, () => true);
roles.allRoles.ADMIN.allow(customActions.requestRefund, () => true);

roles.allRoles.ALL.allow(customActions.buyTicket, () => false);
roles.allRoles.ALL.allow(customActions.requestRefund, () => false);

const roleOptions = {
  additionalRoles: {
    attendee(role: RolesInterface) {
      role.allow(roles.actions.viewProducts, () => true)
      role.allow(roles.actions.viewUsers, () => false)
      role.allow(customActions.buyTicket, () => true)
      role.allow(customActions.requestRefund, () => true)
    }
  },
  additionalActions: Object.values(customActions)
}

await startPlatform({
  ...,
  roleOptions,
  ...
})
```

In the above code we added new custom role `attendee` and 2 actions `buyTicket` & `requestRefund`. In order to access the built in actions and role we also imported roles object from `@unchainedshop/api`
`roles` is an instance of `APIRoles` we used to access both default and built in roles.

### bulkImporter

`bulkImporter` accepts handler objects

### workQueueOptions

`workQueueOptions` accepts `batchCount`, `disableWorker`, `schedule`, `WorkerSchedule` and `workerId`;

```typescript
import { startPlatform } from "@unchainedshop/platform";

await startPlatform({
  ...,
  workQueueOptions: {
      batchCount: 12,
      disableWorker: true,
      workerId: 'vnjzdlnjfhgjzfhglkjfh',
    },
  ...
})
```

# Enable Controlpanel

1. Add @unchainedshop/controlpanel as dependency (`npm install @unchainedshop/controlpanel`)

2. Use the embedControlpanelInMeteorWebApp function after startPlatform
