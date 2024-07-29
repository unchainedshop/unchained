import { LogLevel, log } from '@unchainedshop/logger';
import { IQuotationAdapter, IQuotationDirector, QuotationContext } from '../types.js';
import { BaseDirector } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import { QuotationError } from './QuotationError.js';

const baseDirector = BaseDirector<IQuotationAdapter>('QuotationDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (quotationContext: QuotationContext, unchainedAPI: UnchainedCore) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter: IQuotationAdapter) => {
      const activated = Adapter.isActivatedFor(quotationContext, unchainedAPI);
      if (!activated) {
        log(`Quotation Director -> ${Adapter.key} (${Adapter.version}) skipped`, {
          level: LogLevel.Warning,
        });
      }
      return activated;
    },
  });

export const QuotationDirector: IQuotationDirector = {
  ...baseDirector,

  actions: async (quotationContext, unchainedAPI) => {
    const context = { ...quotationContext, ...unchainedAPI };

    const Adapter = findAppropriateAdapters(quotationContext, unchainedAPI)?.shift();

    if (!Adapter) {
      throw new Error('No suitable quotation plugin available for this context');
    }

    const adapter = Adapter.actions(context);

    return {
      configurationError: () => {
        try {
          return adapter.configurationError();
        } catch (error) {
          log('QuotationDirector -> Error while checking for configurationError', {
            level: LogLevel.Warning,
            ...error,
          });
          return QuotationError.ADAPTER_NOT_FOUND;
        }
      },

      isManualRequestVerificationRequired: async () => {
        try {
          const isRequired = await adapter.isManualRequestVerificationRequired();
          return isRequired;
        } catch (error) {
          log('QuotationDirector -> Error while checking if is manual request verification required', {
            level: LogLevel.Error,
            ...error,
          });
          return null;
        }
      },

      isManualProposalRequired: async () => {
        try {
          const isRequired = await adapter.isManualProposalRequired();
          return isRequired;
        } catch (error) {
          log('QuotationDirector -> Error while checking if is manual proposal required', {
            level: LogLevel.Error,
            ...error,
          });
          return null;
        }
      },

      quote: adapter.quote,
      rejectRequest: adapter.rejectRequest,
      submitRequest: adapter.submitRequest,
      verifyRequest: adapter.verifyRequest,

      transformItemConfiguration: async ({ quantity, configuration }) => {
        try {
          const itemConfiguration = await adapter.transformItemConfiguration({
            quantity,
            configuration,
          });
          return itemConfiguration;
        } catch (error) {
          log('QuotationDirector -> Error while transforming item configuration', {
            level: LogLevel.Error,
            ...error,
          });
          return null;
        }
      },
    };
  },
};
