import { Context } from '@unchainedshop/types/api';
import { LogLevel } from '@unchainedshop/types/logs';
import {
  IQuotationAdapter,
  IQuotationDirector,
  QuotationContext,
} from '@unchainedshop/types/quotations';
import { log } from 'meteor/unchained:logger';
import { BaseDirector } from 'meteor/unchained:utils';
import { QuotationError } from './QuotationError';

const baseDirector = BaseDirector<IQuotationAdapter>('QuotationDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (
  quotationContext: QuotationContext,
  requestContext: Context
) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter) => {
      const activated = Adapter.isActivatedFor(
        quotationContext,
        requestContext
      );
      if (!activated) {
        log(
          `Quotation Director -> ${Adapter.key} (${Adapter.version}) skipped`,
          {
            level: LogLevel.Warning,
          }
        );
      }
      return activated;
    },
  });

export const QuotationDirector: IQuotationDirector = {
  ...baseDirector,

  actions: (quotationContext, requestContext) => {
    const context = { ...quotationContext, ...requestContext };

    const Adapter = findAppropriateAdapters(
      quotationContext,
      requestContext
    )?.shift();

    if (!Adapter) {
      throw new Error(
        'No suitable quotation plugin available for this context'
      );
    }

    const adapter = Adapter.actions(context);

    return {
      configurationError: () => {
        try {
          return adapter.configurationError();
        } catch (error) {
          console.warn(error);
          return QuotationError.ADAPTER_NOT_FOUND;
        }
      },

      isManualRequestVerificationRequired: async () => {
        try {
          return await adapter.isManualRequestVerificationRequired();
        } catch (error) {
          console.error(error);
          return null;
        }
      },

      isManualProposalRequired: async () => {
        try {
          return await adapter.isManualProposalRequired();
        } catch (error) {
          console.error(error);
          return null;
        }
      },

      quote: adapter.quote,
      rejectRequest: adapter.rejectRequest,
      submitRequest: adapter.submitRequest,
      verifyRequest: adapter.verifyRequest,

      transformItemConfiguration: async ({ quantity, configuration }) => {
        try {
          return await adapter.transformItemConfiguration({
            quantity,
            configuration,
          });
        } catch (error) {
          console.error(error);
          return null;
        }
      },
    };
  },
};
