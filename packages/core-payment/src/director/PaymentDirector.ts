import {
  IPaymentAdapter,
  IPaymentDirector,
} from '@unchainedshop/types/payments';
import { BaseDirector } from 'meteor/unchained:utils';
import { paymentLogger } from '../payment-logger';
import { PaymentError } from './PaymentError';

const baseDirector = BaseDirector<IPaymentAdapter>('PaymentDirector');

export const PaymentDirector: IPaymentDirector = {
  ...baseDirector,

  actions: (paymentProvider, paymentContext, requestContext) => {
    const Adapter = baseDirector.getAdapter(paymentProvider.adapterKey);

    if (!Adapter) {
      throw new Error(
        `Payment Plugin ${paymentProvider.adapterKey} not available`
      );
    }

    const adapter = Adapter.actions({
      config: paymentProvider.configuration,
      context: { ...paymentContext, ...requestContext },
    });

    return {
      configurationError: async () => {
        try {
          const error = await adapter.configurationError();
          return error;
        } catch (error) {
          return PaymentError.ADAPTER_NOT_FOUND;
        }
      },

      isActive: async () => {
        try {
          return adapter.isActive();
        } catch (error) {
          paymentLogger.error(error.message);
          return false;
        }
      },

      isPayLaterAllowed: () => {
        try {
          return adapter.isPayLaterAllowed();
        } catch (error) {
          paymentLogger.error(error.message);
          return false;
        }
      },

      charge: async (transactionContext?: any) => {
        return adapter.charge(transactionContext);
      },

      register: async (transactionContext?: any) => {
        return adapter.register(transactionContext);
      },

      sign: async (transactionContext?: any) => {
        return adapter.sign(transactionContext);
      },

      validate: async (token?: any) => {
        const validated = await adapter.validate(token);
        return !!validated;
      },

      run: async (command, ...args) => {
        return adapter[command](...args);
      },
    };
  },
};
