import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import {
  QuotationError,
  IQuotationAdapter,
  QuotationAdapterActions,
  QuotationContext,
} from './QuotationAdapter.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

export type IQuotationDirector = IBaseDirector<IQuotationAdapter> & {
  actions: (quotationContext: QuotationContext, unchainedAPI) => Promise<QuotationAdapterActions>;
};

const baseDirector = BaseDirector<IQuotationAdapter>('QuotationDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (quotationContext: QuotationContext, unchainedAPI) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter: IQuotationAdapter) => {
      const activated = Adapter.isActivatedFor(quotationContext, unchainedAPI);
      if (!activated) {
        logger.warn(`Quotation Director -> ${Adapter.key} (${Adapter.version}) skipped`);
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
          logger.warn('QuotationDirector -> Error while checking for configurationError', {
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
          logger.error(
            'QuotationDirector -> Error while checking if is manual request verification required',
            {
              ...error,
            },
          );
          return true;
        }
      },

      isManualProposalRequired: async () => {
        try {
          const isRequired = await adapter.isManualProposalRequired();
          return isRequired;
        } catch (error) {
          logger.error('QuotationDirector -> Error while checking if is manual proposal required', {
            ...error,
          });
          return true;
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
          logger.error('QuotationDirector -> Error while transforming item configuration', {
            ...error,
          });
          return null;
        }
      },
    };
  },
};
