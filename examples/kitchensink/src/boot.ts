import Fastify from 'fastify';
import cookie from 'cookie';
import { useResponseCache } from '@graphql-yoga/plugin-response-cache';

import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/fastify/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';
import { createLogger } from '@unchainedshop/logger';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

import setupTicketing, { ticketingModules, TicketingAPI } from '@unchainedshop/ticketing';
import connectTicketingToFastify from '@unchainedshop/ticketing/lib/fastify.js';

import ticketingServices from '@unchainedshop/ticketing/lib/services.js';

import seed from './seed.js';
import { createReadStream } from 'node:fs';

const { UNCHAINED_COOKIE_NAME = 'unchained_token' } = process.env;

const logger = createLogger('kitchensink');

function Logger(...args) {
  this.args = args;
}
Logger.prototype.info = logger.info;
Logger.prototype.error = logger.error;
Logger.prototype.debug = logger.debug;
Logger.prototype.fatal = logger.error;
Logger.prototype.warn = logger.warn;
Logger.prototype.trace = logger.trace;
Logger.prototype.child = function () {
  return new Logger();
};

const app = Fastify({
  loggerInstance: new Logger(),
  disableRequestLogging: true,
  trustProxy: true,
});

// Workaround: Allow to use sandbox with localhost
app.addHook('preHandler', async function (request) {
  request.headers['x-forwarded-proto'] = 'https';
});

app.addHook('onSend', async function (_, reply) {
  reply.headers({
    'Access-Control-Allow-Private-Network': 'true',
  });
});

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
connectDefaultPluginsToFastify(app, engine);

// Unchained Ticketing Extension
setupTicketing(engine.unchainedAPI as TicketingAPI, {
  renderOrderPDF: console.log,
  createAppleWalletPass: console.log,
  createGoogleWalletPass: console.log,
});
connectTicketingToFastify(app);

const fileUrl = new URL(import.meta.resolve('../static/index.html'));
app.route({
  method: 'GET',
  url: '*',
  handler: async (req, reply) => {
    reply.status(200);
    reply.header('Content-Type', 'text/html');
    return createReadStream(fileUrl.pathname);
  },
});

try {
  await app.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  logger.error(err);
  process.exit(1);
}
