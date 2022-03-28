import { IPaymentAdapter, IPaymentDirector } from '@unchainedshop/types/payments';
import { BaseDirector } from 'meteor/unchained:utils';
import { createLogger } from 'meteor/unchained:logger';
import { PaymentError } from './PaymentError';

const logger = createLogger('unchained:core-payment');
const baseDirector = BaseDirector<IPaymentAdapter>('PaymentDirector');

export const PaymentDirector: IPaymentDirector = {
  ...baseDirector,

  actions: (paymentProvider, paymentContext, requestContext) => {
    const Adapter = baseDirector.getAdapter(paymentProvider.adapterKey) as IPaymentAdapter;

    if (!Adapter) {
      throw new Error(`Payment Plugin ${paymentProvider.adapterKey} not available`);
    }

    const adapter = Adapter.actions({
      config: paymentProvider.configuration,
      paymentContext: { paymentProvider, paymentProviderId: paymentProvider._id, ...paymentContext },
      context: requestContext,
    });

    return {
      configurationError: () => {
        try {
          const error = adapter.configurationError();
          return error;
        } catch (error) {
          return PaymentError.ADAPTER_NOT_FOUND;
        }
      },

      isActive: () => {
        try {
          return adapter.isActive(paymentContext.transactionContext);
        } catch (error) {
          logger.error(error.message);
          return false;
        }
      },

      isPayLaterAllowed: () => {
        try {
          return adapter.isPayLaterAllowed(paymentContext.transactionContext);
        } catch (error) {
          logger.error(error.message);
          return false;
        }
      },

      charge: async () => {
        return adapter.charge(paymentContext.transactionContext);
      },

      register: async () => {
        return adapter.register(paymentContext.transactionContext);
      },

      sign: async () => {
        return adapter.sign(paymentContext.transactionContext);
      },

      validate: async () => {
        const validated = await adapter.validate(paymentContext.token);
        return !!validated;
      },

      cancel: async () => {
        return adapter.cancel(paymentContext.transactionContext);
      },

      confirm: async () => {
        return adapter.confirm(paymentContext.transactionContext);
      },
    };
  },
};
