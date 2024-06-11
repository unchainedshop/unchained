import './load_env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import {
  startPlatform,
  connectPlatformToExpress4,
  setAccessToken,
  withAccessToken,
} from '@unchainedshop/platform';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import { ApolloServerPluginLandingPageGraphiQLPlayground } from 'apollo-graphiql-playground';
import { log } from '@unchainedshop/logger';
import serveStatic from 'serve-static';
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

import seed from './seed.js';
import { UnchainedUserContext } from '@unchainedshop/types/api.js';

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cookieParser());

  const engine = await startPlatform({
    introspection: true,
    modules: defaultModules,
    context: withAccessToken(),
    plugins: [
      responseCachePlugin({
        async sessionId(ctx) {
          return (ctx.contextValue as UnchainedUserContext).userId || null;
        },
        async shouldReadFromCache(ctx) {
          if ((ctx.contextValue as UnchainedUserContext)?.user?.roles?.includes('admin')) return false;
          return true;
        },
      }),
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageGraphiQLPlayground({
        shouldPersistHeaders: true,
      }),
    ],
    options: {
      accounts: {
        password: {
          twoFactor: {
            appName: 'Example',
          },
        },
      },
      payment: {
        filterSupportedProviders: async ({ providers }) => {
          return providers.sort((left, right) => {
            if (left.adapterKey < right.adapterKey) {
              return -1;
            }
            if (left.adapterKey > right.adapterKey) {
              return 1;
            }
            return 0;
          });
        },
      },
    },
  });

  await seed(engine.unchainedAPI);
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  // Start the GraphQL Server
  await engine.apolloGraphQLServer.start();

  connectPlatformToExpress4(app, engine);
  connectDefaultPluginsToExpress4(app, engine);

  app.use(serveStatic('static', { index: ['index.html'] }));

  await httpServer.listen({ port: process.env.PORT || 3000 });
  log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
