import express from 'express';
import { subscribe } from '@unchainedshop/events';
import { RawPayloadType } from '@unchainedshop/events/EventDirector.js';
import { WorkerEventTypes } from '@unchainedshop/core-worker';
import { Work } from '@unchainedshop/types/worker.js';
import { RendererTypes, registerRenderer } from './template-registry.js';
import loadAppleWalletHandler from './mobile-tickets/apple-webservice.js';
import loadGoogleWalletHandler from './mobile-tickets/google-webservice.js';
import loadPDFHandler from './pdf-tickets/print-webservice.js';
import passes from './module.js';
import type { TicketingAPI } from './types.js';
import setupMagicKey from './magic-key.js';

export type { TicketingAPI, RendererTypes };

export const ticketingModules = {
  passes,
};

export function setupPDFTickets(
  app: express.Express,
  {
    renderOrderPDF,
  }: {
    renderOrderPDF: any;
  },
) {
  registerRenderer(RendererTypes.ORDER_PDF, renderOrderPDF);
  loadPDFHandler(app);
}

export function setupMobileTickets(
  app: express.Express,
  {
    createGoogleWalletPass,
    createAppleWalletPass,
  }: {
    createGoogleWalletPass: any;
    createAppleWalletPass: any;
  },
) {
  registerRenderer(RendererTypes.GOOGLE_WALLET, createGoogleWalletPass);
  registerRenderer(RendererTypes.APPLE_WALLET, createAppleWalletPass);

  loadAppleWalletHandler(app);
  loadGoogleWalletHandler(app);
}

export default function setupTicketing(
  app: express.Express,
  unchainedAPI: TicketingAPI,
  {
    renderOrderPDF,
    createAppleWalletPass,
    createGoogleWalletPass,
  }: {
    renderOrderPDF: any;
    createAppleWalletPass: any;
    createGoogleWalletPass: any;
  },
) {
  setupPDFTickets(app, {
    renderOrderPDF,
  });
  setupMobileTickets(app, {
    createAppleWalletPass,
    createGoogleWalletPass,
  });

  if (!process.env.UNCHAINED_SECRET)
    throw new Error(
      'Unchained Ticketing needs the UNCHAINED_SECRET environment variable to be set in order to allow magic key access to orders and tokens.',
    );

  setupMagicKey();

  subscribe('TOKEN_INVALIDATED', async () => {
    await unchainedAPI.modules.passes.invalidateAppleWalletPasses(unchainedAPI);
  });

  subscribe(WorkerEventTypes.FINISHED, async ({ payload: work }: RawPayloadType<Work>) => {
    if ((work.type === 'EXPORT_TOKEN' || work.type === 'UPDATE_TOKEN_OWNERSHIP') && work.success) {
      await unchainedAPI.modules.passes.invalidateAppleWalletPasses(unchainedAPI);
    }
  });
}
