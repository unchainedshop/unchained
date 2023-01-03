import { Context } from '@unchainedshop/types/api.js';
import { PaymentError, PaymentProvider as PaymentProviderType } from '@unchainedshop/types/payments.js';

export interface PaymentProviderHelperTypes {
  interface: (
    provider: PaymentProviderType,
    _: never,
    context: Context,
  ) => {
    _id: string;
    label: string;
    version: string;
  };
  isActive: (provider: PaymentProviderType, _: never, context: Context) => Promise<boolean>;
  configurationError: (
    provider: PaymentProviderType,
    _: never,
    context: Context,
  ) => Promise<PaymentError>;
}
export const PaymentProvider: PaymentProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.payment.paymentProviders.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  configurationError(obj, _, requestContext) {
    const { modules } = requestContext;
    return modules.payment.paymentProviders.configurationError(obj, requestContext);
  },

  isActive(obj, _, requestContext) {
    const { modules } = requestContext;
    return modules.payment.paymentProviders.isActive(obj, requestContext);
  },
};
