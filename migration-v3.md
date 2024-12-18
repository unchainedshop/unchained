# Migration Guide v2 -> v3

Add the env `UNCHAINED_TOKEN_SECRET`, use any random string secret to the server.

## Schema Changes
Checkout the Changelog for a list. We encourage you to use codegen to have statically typed queries and mutations for frontend projects.

## Apollo to Yoga
Boot.ts files need to be migrated in order to work with the new Yoga GraphQL Server.

First: Dependencies
`npm install @graphql-yoga/plugin-response-cache graphql-yoga`
`npm uninstall @apollo/server-plugin-response-cache @apollo/server apollo-graphiql-playground`

Remove
```js
import {
  startPlatform,
  withAccessToken,
  setAccessToken,
  connectPlatformToExpress4,
} from "@unchainedshop/platform";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageGraphiQLPlayground } from "apollo-graphiql-playground";
import responseCachePlugin from "@apollo/server-plugin-response-cache";
```

Add
```js
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
          return auth || cookies[UNCHAINED_COOKIE_NAME] || null;
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

Remove all imports from `@unchainedshop/types` and find the types in the according core modules, core and platform.