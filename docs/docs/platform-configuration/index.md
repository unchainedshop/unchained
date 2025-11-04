---
sidebar_position: 1
title: Platform Configuration
sidebar_label: Platform Configuration
---


# Platform Configuration

To customize an Unchained Engine project, follow these topics:
1. Boot up: Wire Unchained with a web server and boot the app
2. Configure the Core: Configure behavior of the core modules
3. Plugin: Configure which plugins should load
4. Extend

## Boot Configuration

The main entry point for an Unchained Engine project is `startPlatform` imported from `@unchainedshop/platform`. Calling it will initialize the Unchained Core, add default messaging templates, and set up the background worker.

To make things a bit more simple, Unchained offers different [presets](./plugins/presets.md) for loading functionalities out-of-the box:
- `base` (Simple Catalog Price based Pricing strategies, Manual Delivery & Invoice Payment, GridFS Asset Storage)
- `crypto` (Currency-Rate Updating Workers for ECB & Coinbase, Currency-Converting Pricing Plugin, Event ERC721 Token Lazy-Minting on Ethereum, Payment through Unchained Cryptopay)
- `countries/ch` (Switzerland Tax Calculation and Migros PickMup Integration)
- `all` (All of the above + all other available plugins including plugins for various payment gateways)

We recommend loading at least `base`.

To see it in context, it's best to see an example using Unchained with Fastify, which is being used as a template for [unchainedshop/unchained-app](https://github.com/unchainedshop/unchained-app)-based projects (`boot.ts`):

```ts
import Fastify from "fastify";
import { startPlatform } from "@unchainedshop/platform";
import {
  connect,
  unchainedLogger,
} from "@unchainedshop/api/lib/fastify/index.js";
import defaultModules from "@unchainedshop/plugins/presets/all.js";
import connectDefaultPluginsToFastify from "@unchainedshop/plugins/presets/all-fastify.js";
import { fastifyRouter } from "@unchainedshop/api/lib/fastify/index.js";

// Set up the Fastify web server in insecure mode and set the unchained default logger as request logger
const fastify = Fastify({
  loggerInstance: unchainedLogger("fastify"),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  // Init Unchained Platform with the 'all' plugins preset
  const platform = await startPlatform({
    modules: defaultModules,
  });

  // Use the connect from @unchainedshop/api to connect Unchained to Fastify, setting up the basic endpoints like /graphql
  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== "production",
  });

  // Connect custom rest endpoints of all the plugins with Fastify, for example
  // /rest/payment/datatrans, a webhook endpoint for the Datatrans Payment Provider
  connectDefaultPluginsToFastify(fastify, platform);

  // Bind the official @unchainedshop/adminui to /, a simple statically built SPA that uses the GraphQL endpoint of Unchained Engine
  fastify.register(fastifyRouter, {
    prefix: "/",
  });

  // Tell Fastify to start listening on a port, thus accepting connections
  await fastify.listen({
    host: "::",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
```

To configure various aspects of the platform, `startPlatform` accepts a configuration object with various parameters:
  - `modules: Record<string, { configure: (params: ModuleInput<any>) => any }>`: Modules configuration point. Load your own modules, a preset or a combination of a preset and your own modules.
  - `services: Record<string, any>`: Custom services configuration point. Allows you to extend the functionality of the engine with cross-module business-process functions.
  - `typeDefs`:  Object (GraphQL Schema that gets merged with the default schema)
  - `resolvers`: Object (GraphQL Resolvers that get merged with the default API)
  - `schema`:  Object (GraphQL Executable Schema that gets merged with the default schema, do not use it together with typeDefs & resolvers specified!)
  - `context`: Special function to extend the underlying [GraphQL context](https://the-guild.dev/graphql/yoga-server/docs/features/context). Check the [OIDC Example](https://github.com/unchainedshop/unchained/blob/master/examples/oidc/boot.ts) for how you could use it to add custom Auth functionality.
  - `options`: Options for various submodules of Unchained. See the rest of the configuration section for details.
  - `rolesOptions`: [IRoleOptionConfig](https://docs.unchained.shop/types/interfaces/roles.IRoleOptionConfig.html): Enables you to customize the existing roles and actions, adjusting fine-grained permissions.
  - `bulkImporter`: Enables you to define custom bulk import handlers for a clear separation of data import and e-commerce engine. For more information about the bulk import API, refer [here](../tutorials/bulk-import).
  - `workQueueOptions`: [SetupWorkqueueOptions](https://docs.unchained.shop/types/interfaces/platform.SetupWorkqueueOptions.html) Configuration regarding the work queue, for example disabling it entirely in multi-pod setups
  - `adminUiConfig`: Customize the Unchained Admin UI, for example configuring a Single-Sign-On Link for external Auth support via oAuth.


These options are extended by `YogaServerOptions` so you can pass all options you can normally pass to `createYoga`, add plugins [Yoga GraphQL Plugins](https://the-guild.dev/graphql/yoga-server/docs/features/envelop-plugins) or configure [batching](https://the-guild.dev/graphql/yoga-server/docs/features/request-batching) and other more advanced GraphQL features. Check the [Yoga documentation](https://the-guild.dev/graphql/yoga-server/docs) for more information.


## Getting Help

- 📚 [Full Documentation](/)
- 💬 [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
- 🐛 [Report Issues](https://github.com/unchainedshop/unchained/issues)
- 📧 [Contact Support](mailto:support@unchained.shop)