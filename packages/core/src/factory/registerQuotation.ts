import type { QuotationItemConfiguration, QuotationProposal } from '@unchainedshop/core-quotations';
import {
  QuotationAdapter,
  type QuotationContext,
  type IPlugin,
  type IQuotationAdapter,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerQuotation({
  adapterId,
  isManualRequestVerificationRequired,
  isManualProposalRequired,
  quote,
  submitRequest,
  verifyRequest,
  rejectRequest,
  transformItemConfiguration,
}: {
  adapterId: string;
  isManualRequestVerificationRequired?: boolean;
  isManualProposalRequired?: boolean;
  quote?: (context: QuotationContext) => Promise<QuotationProposal>;
  submitRequest?: (context: QuotationContext) => Promise<boolean>;
  verifyRequest?: (context: QuotationContext) => Promise<boolean>;
  rejectRequest?: (context: QuotationContext) => Promise<boolean>;
  transformItemConfiguration?: (
    params: QuotationItemConfiguration,
    context: QuotationContext,
  ) => Promise<QuotationItemConfiguration | null>;
}): IPlugin {
  const adapter: IQuotationAdapter = {
    ...QuotationAdapter,

    key: `shop.unchained.quotation.${adapterId}`,
    label: 'Quotation: ' + adapterId,
    version: '1.0.0',

    isActivatedFor: () => {
      return true;
    },

    actions: (context) => {
      return {
        ...QuotationAdapter.actions(context),

        configurationError: () => {
          return null;
        },

        isManualRequestVerificationRequired: async () => {
          return isManualRequestVerificationRequired ?? true;
        },

        isManualProposalRequired: async () => {
          return isManualProposalRequired ?? true;
        },

        quote: async () => {
          return quote ? quote(context) : {};
        },

        submitRequest: async () => {
          return submitRequest ? submitRequest(context) : true;
        },

        verifyRequest: async () => {
          return verifyRequest ? verifyRequest(context) : true;
        },

        rejectRequest: async () => {
          return rejectRequest ? rejectRequest(context) : true;
        },

        transformItemConfiguration: async (params) => {
          return transformItemConfiguration
            ? transformItemConfiguration(params, context)
            : { quantity: params.quantity, configuration: params.configuration };
        },
      };
    },
  };

  const plugin: IPlugin = {
    key: adapter.key,
    label: adapter.label,
    version: adapter.version,
    adapters: [adapter],
  };

  pluginRegistry.register(plugin);
  return plugin;
}
