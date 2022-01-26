import { PaymentProviderHelperTypes } from '@unchainedshop/types/payments';

export const PaymentProvider: PaymentProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.payment.paymentProviders.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  async configurationError(obj, _, context) {
    return context.modules.payment.paymentProviders.configurationError(
      obj,
      context
    );
  },
};
