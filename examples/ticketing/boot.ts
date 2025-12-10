import Fastify from 'fastify';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import setupTicketing, { ticketingModules, type TicketingAPI } from '@unchainedshop/ticketing';
import connectTicketingToFastify from '@unchainedshop/ticketing/lib/fastify.js';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';
import seed from './seed.ts';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  const platform = await startPlatform({
    modules: { ...baseModules, ...ticketingModules },
    services: { ...ticketingServices },
  });

  // Unchained Ticketing Extension
  setupTicketing(platform.unchainedAPI as TicketingAPI, {
    renderOrderPDF: () => fastify.log.info('TODO: Rendering Order PDF'),
    createAppleWalletPass: () => fastify.log.info('TODO: Creating Apple Wallet Pass'),
    createGoogleWalletPass: () => fastify.log.info('TODO: Creating Google Wallet Pass'),
  });

  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  });
  connectBasePluginsToFastify(fastify);
  connectTicketingToFastify(fastify);

  await seed(platform.unchainedAPI);
  await setAccessToken(platform.unchainedAPI, 'admin', 'secret');

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
