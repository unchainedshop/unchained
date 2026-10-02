import type { IPlugin } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { WorkerEventTypes, type Work } from '@unchainedshop/core-worker';
import { subscribe, type RawPayloadType } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import ticketingModules from './module.ts';
import type { DiscountCodeHandlers } from './discount-codes.ts';
import setupMagicKey from './magic-key.ts';
import { subscribeTicketProductionSync } from './production-services.ts';
import { createTicketingRoutes } from './routes.ts';
import {
  TicketSalesReportWorker,
  configureTicketSalesReportAutoscheduling,
  type TicketSalesReportScheduleOptions,
} from './sales-report-worker.ts';
import { registerTicketingTemplates } from './templates/index.ts';
import {
  RendererTypes,
  registerRenderer,
  type GoogleWalletPassRenderer,
  type PDFRenderer,
  type PassRenderer,
} from './template-registry.ts';
import type { TicketingAPI } from './index.ts';

const logger = createLogger('unchained:ticketing');

export interface TicketingPluginOptions {
  /** Renders the tickets PDF of an order, served on UNCHAINED_PDF_PRINT_HANDLER_PATH. */
  renderOrderPDF?: PDFRenderer;
  /** Renders the Apple Wallet pass of a ticket, served on APPLE_WALLET_WEBSERVICE_PATH. */
  createAppleWalletPass?: PassRenderer;
  /** Returns the Google Wallet save link of a ticket, redirected to from GOOGLE_WALLET_WEBSERVICE_PATH. */
  createGoogleWalletPass?: GoogleWalletPassRenderer;
  /** Reimbursement code handlers, passed to the passes module unchanged. */
  discountCode?: DiscountCodeHandlers;
  /**
   * E-mails the ticket sales report of the previous day with its CSV files on a schedule. Without it
   * the TICKET_SALES_REPORT worker only runs when work is added.
   */
  salesReport?: TicketSalesReportScheduleOptions;
}

// Voids the Apple passes of redeemed, exported or transferred tickets and pushes the update to devices.
// With a ticket only its pass is refreshed; without one all passes are reconciled.
const subscribeAppleWalletPassInvalidation = (unchainedAPI: TicketingAPI) => {
  const invalidateAppleWalletPasses = async (token?: TokenSurrogate | null) => {
    try {
      await unchainedAPI.modules.passes.invalidateAppleWalletPasses(unchainedAPI, token);
    } catch (e) {
      logger.error(e);
    }
  };

  subscribe('TOKEN_INVALIDATED', async ({ payload }: RawPayloadType<{ token?: TokenSurrogate }>) => {
    await invalidateAppleWalletPasses(payload?.token);
  });
  subscribe(WorkerEventTypes.FINISHED, async ({ payload: work }: RawPayloadType<Work>) => {
    if (!work.success) return;
    // An ownership update concerns many tickets and carries none.
    if (work.type === 'EXPORT_TOKEN') await invalidateAppleWalletPasses(work.input?.token);
    if (work.type === 'UPDATE_TOKEN_OWNERSHIP') await invalidateAppleWalletPasses();
  });
};

/**
 * The ticketing plugin: the passes module, the ticket PDF and wallet routes, the magic-key access
 * rules and the cancellation e-mail defaults. Register it before startPlatform and pass the platform
 * options through withTicketing() for the GraphQL schema and the roles. Routes answer 404 for
 * renderers that are not given. Route paths are read from the environment when this is called.
 */
export function createTicketingPlugin(options: TicketingPluginOptions = {}): IPlugin {
  const { renderOrderPDF, createAppleWalletPass, createGoogleWalletPass, discountCode, salesReport } =
    options;

  return {
    key: 'shop.unchained.ticketing',
    label: 'Unchained Ticketing',
    version: '1.0.0',

    // Checked here and not in onRegister: a failing onRegister is only logged and drops the routes.
    module: ({ db }) => {
      if (!process.env.UNCHAINED_SECRET) {
        throw new Error(
          'Unchained Ticketing needs the UNCHAINED_SECRET environment variable to build the magic keys that give access to orders and tickets.',
          { cause: 'TICKETING_SECRET_MISSING' },
        );
      }
      type PassesModuleInput = Parameters<typeof ticketingModules.passes.configure>[0];
      return {
        passes: ticketingModules.passes.configure({
          db,
          options: { discountCode },
        } as PassesModuleInput),
      };
    },

    routes: createTicketingRoutes(),

    adapters: [TicketSalesReportWorker],

    onRegister: (unchainedAPI) => {
      if (renderOrderPDF) registerRenderer(RendererTypes.ORDER_PDF, renderOrderPDF);
      if (createAppleWalletPass) registerRenderer(RendererTypes.APPLE_WALLET, createAppleWalletPass);
      if (createGoogleWalletPass) registerRenderer(RendererTypes.GOOGLE_WALLET, createGoogleWalletPass);

      registerTicketingTemplates();
      setupMagicKey();
      if (salesReport) configureTicketSalesReportAutoscheduling(salesReport);
      subscribeTicketProductionSync(unchainedAPI as TicketingAPI);

      // Without an Apple renderer there are no passes to refresh.
      if (createAppleWalletPass) subscribeAppleWalletPassInvalidation(unchainedAPI as TicketingAPI);
    },
  };
}
