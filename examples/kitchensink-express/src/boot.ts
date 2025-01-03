import express from 'express';
import http from 'node:http';
import cookie from 'cookie';
import { useResponseCache } from '@graphql-yoga/plugin-response-cache';

import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
import { log } from '@unchainedshop/logger';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

import setupTicketing, { ticketingModules } from '@unchainedshop/ticketing';
import { TicketingAPI } from '@unchainedshop/ticketing';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';

import seed from './seed.js';

const { UNCHAINED_COOKIE_NAME = 'unchained_token' } = process.env;

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
  options: {
    files: {
      privateFileSharingMaxAge: 86400000,
    },
    payment: {
      filterSupportedProviders: async ({ providers }) => {
        return providers.toSorted((left, right) => {
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
connectDefaultPluginsToExpress(app, engine);

// Unchained Ticketing Extension
setupTicketing(app, engine.unchainedAPI as TicketingAPI, {
  renderOrderPDF: console.log,
  createAppleWalletPass: console.log,
  createGoogleWalletPass: console.log,
});

const fileUrl = new URL(import.meta.resolve('../static/index.html'));
app.use('/', async (req, res) => {
  res.status(200).sendFile(fileUrl.pathname);
});

await httpServer.listen({ port: process.env.PORT || 3000 });
log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
