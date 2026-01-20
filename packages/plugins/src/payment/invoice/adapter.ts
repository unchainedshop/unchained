import { type IPaymentAdapter, PaymentAdapter } from '@unchainedshop/core';
import { PaymentProviderType } from '@unchainedshop/core-payment';

export const Invoice: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.invoice',
  label: 'Invoice',
  version: '1.0.0',

  initialConfiguration: [],

  typeSupported: (type) => {
    return type === PaymentProviderType.INVOICE;
  },

  actions: (config, context) => {
    return {
      ...PaymentAdapter.actions(config, context),

      configurationError: () => {
        return null;
      },

      isActive: () => {
        return true;
      },

      isPayLaterAllowed: () => {
        return true;
      },
    };
  },
};
