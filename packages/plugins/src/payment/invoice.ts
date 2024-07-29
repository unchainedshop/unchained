import { IPaymentAdapter } from '@unchainedshop/core-payment';
import { PaymentDirector, PaymentAdapter, PaymentProviderType } from '@unchainedshop/core-payment';

const Invoice: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.invoice',
  label: 'Invoice',
  version: '1.0.0',

  initialConfiguration: [],

  typeSupported: (type) => {
    return type === PaymentProviderType.INVOICE;
  },

  actions: (params) => {
    return {
      ...PaymentAdapter.actions(params),

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

PaymentDirector.registerAdapter(Invoice);
