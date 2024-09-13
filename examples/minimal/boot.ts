import express from 'express';
import http from 'http';
import {
  startPlatform,
  connectPlatformToExpress4,
  setAccessToken,
  withAccessToken,
} from '@unchainedshop/platform';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import { log } from '@unchainedshop/logger';

import seed from './seed.js';

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const engine = await startPlatform({
    introspection: true,
    modules: defaultModules,
    context: withAccessToken(),
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

  await httpServer.listen({ port: process.env.PORT || 3000 });
  log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
