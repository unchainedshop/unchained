import { Context } from '@unchainedshop/types/api';
import { LogLevel, log } from 'meteor/unchained:logger';
import {
  IQuotationAdapter,
  IQuotationDirector,
  QuotationContext,
} from '@unchainedshop/types/quotations';
import { BaseDirector } from 'meteor/unchained:utils';
import { QuotationError } from './QuotationError';

const baseDirector = BaseDirector<IQuotationAdapter>('QuotationDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (quotationContext: QuotationContext, requestContext: Context) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter: IQuotationAdapter) => {
      const activated = Adapter.isActivatedFor(quotationContext, requestContext);
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

  actions: (quotationContext, requestContext) => {
    const context = { ...quotationContext, ...requestContext };

    const Adapter = findAppropriateAdapters(quotationContext, requestContext)?.shift();

    if (!Adapter) {
      throw new Error('No suitable quotation plugin available for this context');
    }

    const adapter = Adapter.actions(context);

    return {
      configurationError: async () => {
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
          return adapter.isManualRequestVerificationRequired();
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
          return adapter.isManualProposalRequired();
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
          return adapter.transformItemConfiguration({
            quantity,
            configuration,
          });
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
