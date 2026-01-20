import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
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
  // Register base plugins before starting platform
  registerBasePlugins();

  const platform = await startPlatform({
    modules: ticketingModules,
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

  // Register ticketing routes (ticketing package not yet migrated to plugin system)
  connectTicketingToFastify(fastify);

  await seed(platform.unchainedAPI);

  // Warning: Do not use this in production - creates access token for bulk import API
  const result = await platform.unchainedAPI.modules.users.createAccessToken('admin');
  if (result) {
    fastify.log.info(`Access token for admin: ${result.token}`);
  }

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
