import { IPaymentAdapter } from '@unchainedshop/types/payments';
import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

const { POSTFINANCE_SECRET } = process.env;

const Postfinance: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'ch.postfinance',
  label: 'Postfinance',
  version: '1.0',

  initialConfiguration: [],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (params) => {
    return {
      ...PaymentAdapter.actions(params),

      configurationError: async () => {
        if (!POSTFINANCE_SECRET) {
          return PaymentError.WRONG_CREDENTIALS;
        }
        return null;
      },
      isActive: async () => {
        return false;
      },

      isPayLaterAllowed: () => {
        return false;
      },
    };
  },
};

PaymentDirector.registerAdapter(Postfinance);
