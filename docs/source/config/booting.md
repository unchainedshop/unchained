---
title: 'Boot up'
description: Start the Unchained Engine
---
### Table of contents

- [Platform Configuration](#1-platform-configuration) 
- [Options](#11-options)
- [Modules](#12-modules)
- [Services](#13-services)
- [RoleOptions](#14-rolesoptions)
- [BulkImporter](#15-bulkimporter)
- [WorkQueueOptions](#16-workqueueoptions)



# 1. Platform Configuration

Setting up the Unchained Engine is simple:

Add `@unchainedshop/platform` to your unchained project, copy the dependencies part of the minimal example to your own project's package.json, or you can use the script we have prepared to scaffold a project template by running `npm  init @unchainedshop` and choose the template that best suits your need.

The main entry point for unchained engine is `startPlatform` imported from `@unchainedshop/platform` which will start the awesome e-commerce engine ready for a shop.

```typescript
import { startPlatform } from '@unchainedshop/platform'

const unchainedApi = await startPlatform({})

```
`startPlatform` returns the unchained api that lets you control all the modules and services defined. for example you can create seed the database with configurations like add currency, language, payment provider, admin accounts etc...

```typescript
await unchainedApi.modules.accounts.createUser(
  {
    email: 'admin@unchained.local',
    guest: false,
    initialPassword: 'true',
    password: hashPassword('admin'),
    profile: { address: {} },
    roles: ['admin'],
    username: 'admin',
  },
  { skipMessaging: true },
)

```
Its also possible to configure the platform with a little effort through the various configuration options available.
These options are available:
  - `modules: Record<string, { configure: (params: ModuleInput<any>) => any }>`: Custom modules configuration point. allows you to extends the functionality the engine.
  - `services: Record<string, any>`: Custom services configuration point. allows you to extends the functionality the engine.
  - `typeDefs`:  Object (GraphQL Schema that gets merged with the default schema)
  - `schema`:  Object (GraphQL Schema that gets merged with the default schema)
  - `resolvers`: Object (GraphQL Resolvers that get merged with the default API)
  - [`options: ModuleOptions`](#11-options):  Configuration options used to change the default behavior of built in module.
  - `rolesOptions: [IRoleOptionConfig](https://docs.unchained.shop/types/interfaces/roles.IRoleOptionConfig.html)`: Used to manage built in and custom user privileges
  - `bulkImporter`: bulkImporterOptions
  - `workQueueOptions`
  - `context`

Other options are forwarded to the Apollo Engine, the available options are documented here: https://www.apollographql.com/docs/apollo-server


## 1.1 Options

You can configure the modules registered on the platform, both built in and custom modules you registered with the [`modules`](#12-modules) option. 

```typescript
startPlatform({
  options: {
      orders: {
        ensureUserHasCart: true,
        orderNumberHashFn,
      },
      enrollments: {
        autoSchedulingSchedule: null,
      },
      accounts: {
        autoMessagingAfterUserCreation: false,
        server: {
          loginExpirationInDays: 180,
        },
      },
      delivery: {
        async determineDefaultProvider({ providers, order }, context) {
          const lastDeliveryProviderId = await getLastDeliveryProviderId(
            order.userId,
            context as AppContext
          );
          const foundProvider = providers.find(
            ({ _id }) => _id === lastDeliveryProviderId
          );
          if (foundProvider) {
            return foundProvider;
          }

          return providers?.length > 0 && providers[0];
        },
      },
    },
})

```
Below are all the available built in module configuration options:

[Account](./accounts) module

- `mergeUserCartsOnLogin`: a boolean with default value `true`. any product added by a user before login in will be merged when a user logs in if set to `true`.
- `autoMessagingAfterUserCreation`: a boolean with default value `true`. Send a confirmation email when a user is enrolled initially.
- `server = {}`
- `password = {}`

[Assortments](./assortments) module

- `setCachedProductIds`: function with `assortmentId` and `productIds` input returns a number promise
- `getCachedProductIds`: a function with `filterId` input
- `zipTree`: a function with `data` input returns a array of string
- `slugify`: a function with `title` input returns a string

[Delivery](./delivery) module
- `filterSupportedProviders`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of array of `DeliveryProvider`
- `determineDefaultProvider`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of `DeliveryProvider`

[Enrollments](./enrollments) module

- `autoSchedulingSchedule`: array of object
- `autoSchedulingInput`: a function with default empty object
- `enrollmentNumberHashFn`: function with two inputs `enrollment` and `index` returns string

[Files](./files) module

- `transformUrl`: function with two inputs `url` and [`params`](https://docs.unchained.shop/types/interfaces/files.FilesSettings.html#transformUrl) of object return string

[Filters](./filters) module

- `setCachedProductIds`: a function with `filterId`, `productIds` and `productIdsMap` input returns a number promise
- `getCachedProductIds`: a function with `filterId` input
- `skipInvalidationOnStartup`: boolean with default `false`

[Orders](./orders) module

- `ensureUserHasCart`: a boolean with default false
- `orderNumberHashFn`: a function with `order` and `index` input
- `validateOrderPosition`: a function with `validationParams` and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) input

[Payment](./payment) module
- `filterSupportedProviders`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of array of `PaymentProvider`
- `determineDefaultProvider`: a function with `params`: { providers, order } and `context` with type [`Context`](https://docs.unchained.shop/types/api.Context.html) inputs returns promise of `PaymentProvider`

[Quotations](./quotations) module

- `quotationNumberHashFn`: a function with with `quotation` and `index` input returns string

## 1.2 Modules

Enables the developer to add additional functionality to the core engine. There might be cases where the out of the box functionalities are not enough to solve a particular problem. On such cases it is possible to add a custom module that will be available through out the engine context just like built in modules.
In most cases this goes together with [extending the schema](../advanced-config/extending-schema) to include additional mutations and queries with custom resolvers.

It accepts key-value pair where `key` is the module name and `value` is an object that has one field named `configure`.
configure function receives a single object `ModuleInput` as it's only argument just like any other build in module. this mean you can pass the custom module configuration option like you would with the built in modules and have the underling database available inside the module configuration as well as a migration.

Below is an example of a custom module that will be used to change currency of a cart after creation.

```typescript
import { OrdersCollection } from '@unchainedshop/core-orders'
import { generateDbFilterById } from '@unchainedshop/utils'
import { Order } from '@unchainedshop/types/orders';

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

## 1.3 Services

Services allow you to add utility functions that can be used throughout the engine context. Unchained provides build in services or utility functions for most of the modules. It is also possible to register a custom service just like modules and access it like built in ones. this is useful in encapsulating a certain operation in a single function and utilize it everywhere and keep your code DRY. 
You can access built in or custom services from unchained context anywhere in the application like so:
```
unchainedApiContext.services.serviceName.[function name]
```
#### Custom Service
  It is possible to create a custom service for your need and have it available throughout the engine context like the built-in services. Custom services function can accept first arguments that will be used in the service and will also receive unchained context as there second argument

  ```
  function serviceFunc(args: obj, context: Context) {
    ...
  }
  ``` 

### Built in Services

### 1.3.1 `bookmarkServices`
  Enables you to manage bookmarks
  - **migrateBookmarksService(params: [MigrateBookmarksService](https://docs.unchained.shop/types/types/bookmarks.MigrateBookmarksService.html))**: Used to migrate bookmarked products from one user account to another. Useful for example when we want to keep a product a user has bookmarked before registering after they register.

### 1.3.2 `countryServices`
- **resolveDefaultCurrencyCode(params: [ResolveDefaultCurrencyCodeService](https://docs.unchained.shop/types/types/countries.ResolveDefaultCurrencyCodeService.html))**: returns a default currency for a given country code passed as its only argument. 

### 1.3.3 `fileServices`

  - **linkFile(params: [LinkFileService](https://docs.unchained.shop/types/types/files.LinkFileService.html))**: Used to link files uploaded to an S3-compatible storage server after a successful upload using `createSignedURL`.
  - **createSignedURL(params: [CreateSignedURLService](https://docs.unchained.shop/types/types/files.CreateSignedURLService.html))**: Returns pre-signed URLs, a client can upload files directly to an S3-compatible cloud storage server (S3) without exposing the S3 credentials to the user. 
  - **uploadFileFromURL(params: [UploadFileFromURLService](https://docs.unchained.shop/types/types/files.UploadFileFromURLService.html))**: Used to upload files from URL.
  - **uploadFileFromStream(params: [UploadFileFromStreamService](https://docs.unchained.shop/types/types/files.UploadFileFromStreamService.html))**: Used to upload base64 file stream.
  - **removeFiles(params: [RemoveFilesService](https://docs.unchained.shop/types/types/files.RemoveFilesService.html))**: Used to remove a single file.

### 1.3.4 `orderServices`
  - **migrateOrderCartsService(params: [MigrateOrderCartsService](https://docs.unchained.shop/types/types/orders.MigrateOrderCartsService.html))**: Used to migrate order cart from one user to another. useful for example when we want to keep products a user has added to cart before logging in after they log in.
  - **createUserCartService(params: [CreateUserCartService](https://docs.unchained.shop/types/types/orders.CreateUserCartService.html))**: Used to create cart for current user or a user with the specified ID through its arguments.

### 1.3.5 `paymentServices`
  - **chargeService(params: [ChargeService](https://docs.unchained.shop/types/types/payments.ChargeService.html))**: Used to charge order payment with the provided payment.
  - **registerPaymentCredentialsService(params: [RegisterPaymentCredentialsService](https://docs.unchained.shop/types/types/payments.RegisterPaymentCredentialsService.html))**: Used to assign user payment credential to the provided payment provider.
  - **cancelService(params: [CancelService](https://docs.unchained.shop/types/types/payments.CancelService.html))**: Used for canceling payment
  - **confirmService(params: [ConfirmService](https://docs.unchained.shop))**:  Used to confirm a payment when received. 

### 1.3.6 `productServices`
- **removeProduct(params: [RemoveProductService](https://docs.unchained.shop/types/types/products.RemoveProductService.html))**: Used to delete product. **Note once a product is deleted there is no way reverting the action**.

### 1.3.7 `userServices`
  - **getUserCountry(params: [GetUserRoleActionsService](https://docs.unchained.shop/types/types/user.GetUserRoleActionsService.html))**: Returns the specified user country
  - **getUserLanguage(params: [GetUserLanguageService](https://docs.unchained.shop/types/types/user.GetUserLanguageService.html))**: Returns the specified user Language
  - **getUserRoleActions(params: [GetUserRoleActionsService](https://docs.unchained.shop/types/types/user.GetUserRoleActionsService.html))**: Returns the specified user roles
  - **updateUserAvatarAfterUpload(params: [UpdateUserAvatarAfterUploadService](https://docs.unchained.shop/types/types/user.UpdateUserAvatarAfterUploadService.html))**: Used to update user avatar.

 ## 1.4 rolesOptions

`roleOptions` option enables you to customize the existing roles for an API and assign roles to new query and/or mutation resolvers you have created.
It expects an object with `IRoleOptionConfig` with fields.

- `additionalRoles: Record<string, (role: RolesInterface) => void>` an object with key defining the role name and value a function that will assign the appropriate role, it gets the global `Role` class as it's only argument to allow or deny access to default or custom actions registered on the engine.
- `additionalActions: Array<string>` array of custom action names you want to assign default or custom roles.

**You can access the built in roles, By importing it from @unchaiendshop/api**

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

## 1.5 bulkImporter
- **bulkImporter(params: [{ handlers?: Record<string, [BulkImportHandler](https://docs.unchained.shop/types/types/platform.BulkImportHandler.html)> }])**: Enables you to define custom bulk import handlers. for more information about bulk import API refer [here](../advanced-config/entities#bulk-import-api)

## 1.6 workQueueOptions

- **workQueueOptions(params: [SetupWorkqueueOptions](https://docs.unchained.shop/types/interfaces/platform.SetupWorkqueueOptions.html))**: Used for setting  default cron worker to perform a task within a given interval

