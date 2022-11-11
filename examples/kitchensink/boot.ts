import './load_env';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { startPlatform } from '@unchainedshop/platform';
import { defaultModules, useDefaultMiddlewares } from '@unchainedshop/plugins';
import serveStatic from 'serve-static';

import loginWithSingleSignOn from './login-with-single-sign-on';
import seed from './seed';

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cookieParser());

  const unchainedApi = await startPlatform({
    expressApp: app,
    introspection: true,
    modules: defaultModules,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
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

  await seed(unchainedApi);

  // The following lines will activate SSO from Unchained Cloud to your instance,
  // if you want to further secure your app and close this rabbit hole,
  // remove the following lines
  const singleSignOn = loginWithSingleSignOn(unchainedApi);
  app.use('/', singleSignOn);
  app.use('/.well-known/unchained/cloud-sso', singleSignOn);
  app.use(serveStatic('static', { index: ['index.html'] }));
  // until here

  useDefaultMiddlewares(unchainedApi, app);

  await httpServer.listen({ port: process.env.PORT || 3000 });
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
