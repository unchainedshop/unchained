import { type IPaymentAdapter, PaymentAdapter, PaymentDirector } from '@unchainedshop/core';
import { PaymentProviderType } from '@unchainedshop/core-payment';

const InvoicePrepaid: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.invoice-prepaid',
  label: 'Invoice pre-paid',
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
        return false;
      },

      charge: async () => {
        return false;
      },
    };
  },
};

PaymentDirector.registerAdapter(InvoicePrepaid);
