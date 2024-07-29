import { IPaymentAdapter } from '@unchainedshop/core-payment';
import { PaymentDirector, PaymentAdapter, PaymentProviderType } from '@unchainedshop/core-payment';

const InvoicePrepaid: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.invoice-prepaid',
  label: 'Invoice pre-paid',
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
        return false;
      },

      charge: async () => {
        return false;
      },
    };
  },
};

PaymentDirector.registerAdapter(InvoicePrepaid);
