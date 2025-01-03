import express from 'express';
import appleWalletHandler from './mobile-tickets/apple-handler-express.js';
import googleWalletHandler from './mobile-tickets/google-handler-express.js';
import printTicketsHandler from './pdf-tickets/print-handler-express.js';

export default (app: express.Express) => {
  const {
    APPLE_WALLET_WEBSERVICE_PATH = '/rest/apple-wallet',
    GOOGLE_WALLET_WEBSERVICE_PATH = '/rest/google-wallet',
    UNCHAINED_PDF_PRINT_HANDLER_PATH = '/rest/print_tickets',
  } = process.env;

  app.use(
    UNCHAINED_PDF_PRINT_HANDLER_PATH,
    express.json({
      type: 'application/json',
    }),
    printTicketsHandler,
  );
  app.use(
    APPLE_WALLET_WEBSERVICE_PATH,
    express.json({
      type: 'application/json',
    }),
    appleWalletHandler,
  );

  app.use(
    GOOGLE_WALLET_WEBSERVICE_PATH,
    express.json({
      type: 'application/json',
    }),
    googleWalletHandler,
  );
};
