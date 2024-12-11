import express from 'express';
import http from 'http';
import { useExecutionCancellation } from 'graphql-yoga';
import { useResponseCache } from '@graphql-yoga/plugin-response-cache';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import { log } from '@unchainedshop/logger';
import setupTicketing, { ticketingModules } from '@unchainedshop/ticketing';
import { TicketingAPI } from '@unchainedshop/ticketing';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

import seed from './seed.js';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';
import cookie from 'cookie';

const { UNCHAINED_COOKIE_NAME = 'unchained_token' } = process.env;

const start = async () => {
  const app = express();

  // Workaround: Allow to use sandbox with localhost
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    req.headers['x-forwarded-proto'] = 'https';
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
  });

  const httpServer = http.createServer(app);
  const engine = await startPlatform({
    modules: { ...defaultModules, ...ticketingModules },
    services: { ...ticketingServices },
    plugins: [
      useExecutionCancellation(),
      useResponseCache({
        ttl: 0,
        session(req) {
          const auth = req.headers.get('authorization');
          const cookies = cookie.parse(req.headers.get('cookie') || '');
          return auth || cookies[UNCHAINED_COOKIE_NAME] || null;
        },
        enabled(req) {
          return process.env.NODE_ENV === 'production';
        },
      }),
    ],
    options: {
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

  connect(app, engine);
  connectDefaultPluginsToExpress4(app, engine);

  // Unchained Ticketing Extension
  setupTicketing(app, engine.unchainedAPI as TicketingAPI, {
    renderOrderPDF: console.log,
    createAppleWalletPass: console.log,
    createGoogleWalletPass: console.log,
  });

  app.use('/', async (req, res) => {
    const fileUrl = new URL(import.meta.resolve('../static/index.html'));
    res.status(200).sendFile(fileUrl.pathname);
  });

  await httpServer.listen({ port: process.env.PORT || 3000 });
  log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();