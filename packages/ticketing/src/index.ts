import { subscribe } from '@unchainedshop/events';
import { RawPayloadType } from '@unchainedshop/events';
import { WorkerEventTypes, Work } from '@unchainedshop/core-worker';
import { RendererTypes, registerRenderer } from './template-registry.js';
import ticketingModules, { TicketingModule } from './module.js';

import { TicketingAPI } from './types.js';
import setupMagicKey from './magic-key.js';
import ticketingServices, { TicketingServices } from './services.js';

export type { TicketingAPI, RendererTypes };

export { ticketingServices, ticketingModules, TicketingModule, TicketingServices };

export function setupPDFTickets({ renderOrderPDF }: { renderOrderPDF: any }) {
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
    renderOrderPDF,
    createAppleWalletPass,
    createGoogleWalletPass,
  }: {
    renderOrderPDF: any;
    createAppleWalletPass: any;
    createGoogleWalletPass: any;
  },
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
