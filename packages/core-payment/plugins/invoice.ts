import { IPaymentAdapter } from '@unchainedshop/types/payments';
import { PaymentDirector, PaymentAdapter, PaymentProviderType } from 'meteor/unchained:core-payment';

const Invoice: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.invoice',
  label: 'Invoice (manually)',
  version: '1.0',

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
