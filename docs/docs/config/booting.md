---
sidebar_position: 1
title: Boot up
sidebar_label: Boot up
---
# Boot up
:::info
Start the Unchained Engine
:::



Setting up the Unchained Engine is simple:

Add `@unchainedshop/platform` to your node 20+ project, copy the dependencies part of the minimal example to your own project's package.json, or you can use the script we have prepared to scaffold a project template by running `npm  init @unchainedshop` and choose the template that best suits your need.

The main entry point for unchained engine is `startPlatform` imported from `@unchainedshop/platform` which will start the awesome e-commerce engine ready for a shop.

```typescript
import { startPlatform } from '@unchainedshop/platform'

const unchainedAPI = await startPlatform({})
```

`startPlatform` returns the unchained api that lets you control all the modules and services defined. for example you can create seed the database with configurations like add currency, language, payment provider, admin accounts etc...

```typescript
await unchainedAPI.modules.users.createUser(
  {
    email: 'admin@unchained.local',
    guest: false,
    initialPassword: true,
    password: 'admin',
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
  - `context`: Special function to extend the underlying [GraphQL context](https://the-guild.dev/graphql/yoga-server/docs/features/context). Check the [OIDC Example](https://github.com/unchainedshop/unchained/blob/master/examples/oidc/boot.ts) for how you could use it to add custom Auth.
  - `options`: Options for various submodules of Unchained. See the rest of the configuration section for details 
  - `plugins`: Optional 
  - `rolesOptions`: [IRoleOptionConfig](https://docs.unchained.shop/types/interfaces/roles.IRoleOptionConfig.html): Enables you to customize the existing roles and actions, adjusting fine-grained permissions.
  - `bulkImporter`: Enables you to define custom bulk import handlers for a clear separation of Data Import and E-Commerce Engine. For more information about bulk import API refer [here](../advanced/bulk-import)
  - `workQueueOptions`: [SetupWorkqueueOptions](https://docs.unchained.shop/types/interfaces/platform.SetupWorkqueueOptions.html) Configuration regarding the work queue, for example disabling it entirely in multi-pod setups
  - `adminUiConfig`: Customize the Unchained Admin UI


These options are extended by `YogaServerOptions` so you can pass a list of [Yoga GraphQL Plugins](https://the-guild.dev/graphql/yoga-server/docs/features/envelop-plugins) or configure [batching](https://the-guild.dev/graphql/yoga-server/docs/features/request-batching) etc.

Undocumented options are forwarded to the Apollo Engine, the available options are documented here: https://www.apollographql.com/docs/apollo-server