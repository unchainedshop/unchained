import { PaymentProviderHelperTypes } from '@unchainedshop/types/payments';

export const PaymentProviderTypes: PaymentProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.payment.paymentProviders.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  configurationError(obj, _, { modules }) {
    return modules.payment.paymentProviders.configurationError(obj);
  },
};
