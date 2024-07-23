import './load_env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import {
  startPlatform,
  connectPlatformToExpress4,
  setAccessToken,
  withAccessToken,
} from '@unchainedshop/platform';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import { log } from '@unchainedshop/logger';
import setupTicketing, { ticketingModules } from '@unchainedshop/ticketing';
import { TicketingAPI } from '@unchainedshop/ticketing';

import serveStatic from 'serve-static';
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

import seed from './seed.js';
import ticketingServices from '@unchainedshop/ticketing/services.js';

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cookieParser());

  const engine = await startPlatform({
    introspection: true,
    modules: { ...defaultModules, ...ticketingModules },
    services: { ...ticketingServices },
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

  console.log(engine.apolloGraphQLServer);

  await seed(engine.unchainedAPI);
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  connectPlatformToExpress4(app, engine);
  connectDefaultPluginsToExpress4(app, engine);

  // Unchained Ticketing Extension
  setupTicketing(app, engine.unchainedAPI as TicketingAPI, {
    renderOrderPDF: console.log,
    createAppleWalletPass: console.log,
    createGoogleWalletPass: console.log,
  });

  app.use(serveStatic('static', { index: ['index.html'] }));

  await httpServer.listen({ port: process.env.PORT || 3000 });
  log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
