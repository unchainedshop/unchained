import { IPaymentAdapter } from '@unchainedshop/types/payments';
import { PaymentDirector, PaymentAdapter, PaymentProviderType } from 'meteor/unchained:core-payment';

const InvoicePrepaid: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.invoice-prepaid',
  label: 'Invoice Prepaid (manually)',
  version: '1.0',

  initialConfiguration: [],

  typeSupported: (type) => {
    return type === PaymentProviderType.INVOICE;
  },

  actions: (params) => {
    return {
      ...PaymentAdapter.actions(params),

      configurationError: async () => {
        return null;
      },

      isActive: async () => {
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
