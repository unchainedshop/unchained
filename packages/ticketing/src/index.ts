import { subscribe } from '@unchainedshop/events';
import type { RawPayloadType } from '@unchainedshop/events';
import { WorkerEventTypes, type Work } from '@unchainedshop/core-worker';
import { RendererTypes, registerRenderer } from './template-registry.ts';
import ticketingModules, { type TicketingModule } from './module.ts';

import type { TicketingAPI } from './types.ts';
import setupMagicKey from './magic-key.ts';
import ticketingServices, { type TicketingServices } from './services.ts';

import { defaultTicketReceiptRenderer } from './pdf-tickets/defaultTicketReceiptRenderer.js';

export type { TicketingAPI, RendererTypes, TicketingModule, TicketingServices };

export { ticketingServices, ticketingModules };

export function setupPDFTickets({ renderOrderPDF }: { renderOrderPDF?: any }) {
  registerRenderer(RendererTypes.ORDER_PDF, renderOrderPDF);
}

export function setupMobileTickets({
  createGoogleWalletPass,
  createAppleWalletPass,
}: {
  createGoogleWalletPass: any;
  createAppleWalletPass: any;
}) {
  registerRenderer(RendererTypes.GOOGLE_WALLET, createGoogleWalletPass);
  registerRenderer(RendererTypes.APPLE_WALLET, createAppleWalletPass);
}

export default function setupTicketing(
  unchainedAPI: TicketingAPI,
  {
    renderOrderPDF = defaultTicketReceiptRenderer,
    createAppleWalletPass,
    createGoogleWalletPass,
  }: {
    renderOrderPDF?: any;
    createAppleWalletPass?: any;
    createGoogleWalletPass?: any;
  } = {},
) {
  setupPDFTickets({
    renderOrderPDF,
  });
  setupMobileTickets({
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
