import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import setupTicketing, { ticketingModules, type TicketingAPI } from '@unchainedshop/ticketing';
import connectTicketingToFastify from '@unchainedshop/ticketing/lib/fastify.js';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';
import configureAppleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureAppleWalletPass.js';
import configureGoogleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureGoogleWalletPass.js';
import seed from './seed.ts';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

// Configure Apple Wallet Pass (requires @walletpass/pass-js and certificates)
const createAppleWalletPass = process.env.PASS_TEAM_ID
  ? configureAppleWalletPass({
      templateConfig: {
        description: 'Event Ticket',
        organizationName: process.env.ORGANIZATION_NAME || 'Unchained Commerce',
        passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.com.example.ticket',
        teamIdentifier: process.env.PASS_TEAM_ID,
        backgroundColor: 'rgb(255,255,255)',
        foregroundColor: 'rgb(50,50,50)',
      },
      // Optional: customize field labels for localization
      labels: {
        eventLabel: 'Event',
        locationLabel: 'Venue',
        ticketNumberLabel: 'Ticket #',
        infoLabel: 'Details',
        slotChangeMessage: 'Event time changed: %@',
        barcodeHint: 'Scan for entry',
      },
    })
  : undefined;

// Configure Google Wallet Pass (requires googleapis and jsonwebtoken)
const createGoogleWalletPass = process.env.GOOGLE_WALLET_ISSUER_ID
  ? configureGoogleWalletPass({
      issuerName: process.env.ORGANIZATION_NAME || 'Unchained Commerce',
      countryCode: 'CH',
      hexBackgroundColor: '#FFFFFF',
      homepageUri: {
        uri: process.env.ROOT_URL || 'https://unchained.shop',
        description: 'Event Website',
      },
    })
  : undefined;

try {
  const platform = await startPlatform({
    modules: { ...baseModules, ...ticketingModules },
    services: { ...ticketingServices },
  });

  // Setup Unchained Ticketing with:
  // - Default SVG-based PDF renderer (uses defaultTicketReceiptRenderer)
  // - Optional Apple Wallet Pass (if PASS_TEAM_ID is configured)
  // - Optional Google Wallet Pass (if GOOGLE_WALLET_ISSUER_ID is configured)
  setupTicketing(platform.unchainedAPI as TicketingAPI, {
    // renderOrderPDF uses defaultTicketReceiptRenderer when not specified
    // For React-PDF based rendering, use:
    // renderOrderPDF: createPDFTicketRenderer(),
    createAppleWalletPass,
    createGoogleWalletPass,
  });

  connect(fastify, platform, {
    adminUI: true,
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    initPluginMiddlewares: (app) => {
      connectBasePluginsToFastify(app);
      connectTicketingToFastify(app);
    },
  });

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
