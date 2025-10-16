import type { FastifyInstance } from 'fastify';
import appleWalletHandler from './mobile-tickets/apple-handler-fastify.js';
import googleWalletHandler from './mobile-tickets/google-handler-fastify.js';
import printTicketsHandler from './pdf-tickets/print-handler-fastify.js';

export default (app: FastifyInstance) => {
  const {
    APPLE_WALLET_WEBSERVICE_PATH = '/rest/apple-wallet',
    GOOGLE_WALLET_WEBSERVICE_PATH = '/rest/google-wallet',
    UNCHAINED_PDF_PRINT_HANDLER_PATH = '/rest/print_tickets',
  } = process.env;

  app.route({
    url: `${APPLE_WALLET_WEBSERVICE_PATH}*`,
    method: ['GET', 'POST', 'DELETE'],
    handler: appleWalletHandler,
  });

  app.route({
    url: `${GOOGLE_WALLET_WEBSERVICE_PATH}/download/:tokenId`,
    method: 'GET',
    handler: googleWalletHandler,
  });

  app.route({
    url: `${UNCHAINED_PDF_PRINT_HANDLER_PATH}/*`,
    method: 'GET',
    handler: printTicketsHandler,
  });
};
