import './load_env.js';
import express from 'express';
import http from 'http';
import { useExecutionCancellation } from 'graphql-yoga';
import { useResponseCache } from '@graphql-yoga/plugin-response-cache';
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
import cookie from 'cookie';

const { UNCHAINED_COOKIE_NAME = 'unchained_token' } = process.env;

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const engine = await startPlatform({
    modules: { ...defaultModules, ...ticketingModules },
    services: { ...ticketingServices },
    context: withAccessToken(),
    plugins: [
      useExecutionCancellation(),
      useResponseCache({
        ttl: 0,
        session(req) {
          const auth = req.headers.get('authorization');
          const cookies = cookie.parse(req.headers.get('cookie') || '');
          return auth || cookies[UNCHAINED_COOKIE_NAME] || null;
        },
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
