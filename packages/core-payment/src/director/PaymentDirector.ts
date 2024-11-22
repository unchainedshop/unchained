import { BaseDirector } from '@unchainedshop/utils';
import { createLogger } from '@unchainedshop/logger';
import { PaymentError } from './PaymentError.js';
import { IPaymentAdapter, IPaymentDirector, PaymentContext } from '../types.js';

const logger = createLogger('unchained:core-payment');
const baseDirector = BaseDirector<IPaymentAdapter>('PaymentDirector');

export const PaymentDirector: IPaymentDirector = {
  ...baseDirector,

  actions: async (paymentProvider, paymentContext, unchainedAPI) => {
    const Adapter = baseDirector.getAdapter(paymentProvider.adapterKey) as IPaymentAdapter;

    if (!Adapter) {
      throw new Error(`Payment Plugin ${paymentProvider.adapterKey} not available`);
    }

    const newPaymentContext: PaymentContext = {
      ...paymentContext,
    };

    if (paymentContext?.orderPayment) {
      const { modules } = unchainedAPI;
      const { orderId } = paymentContext.orderPayment;
      const order =
        paymentContext?.order ||
        (await modules.orders.findOrder({
          orderId,
        }));

      newPaymentContext.order = order;
    }

    const adapter = Adapter.actions(paymentProvider.configuration, {
      paymentProvider,
      paymentProviderId: paymentProvider._id,
      ...newPaymentContext,
      ...unchainedAPI,
    });

    return {
      configurationError: () => {
        try {
          const error = adapter.configurationError();
          return error;
        } catch {
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
