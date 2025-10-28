import { PaymentConfiguration } from '@unchainedshop/core-payment';
import {
  PaymentContext,
  PaymentAdapter,
  PaymentDirector,
  PaymentChargeActionResult,
} from '../core-index.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';

export default function registerInvoicePayment({
  adapterId,
  active,
  payLaterAllowed,
  charge,
}: {
  adapterId: string;
  active?: boolean;
  payLaterAllowed?: boolean;
  charge:
    | false
    | ((
        configuration: PaymentConfiguration,
        context: PaymentContext,
      ) => Promise<PaymentChargeActionResult | false>);
}) {
  PaymentDirector.registerAdapter({
    ...PaymentAdapter,

    key: `shop.unchained.payment.invoice-${adapterId}`,
    label: 'Invoice Payment: ' + adapterId,
    version: '1.0.0',

    initialConfiguration: [],

    typeSupported: (type) => {
      return type === PaymentProviderType.INVOICE;
    },

    actions: (config, context) => {
      return {
        ...PaymentAdapter.actions(config, context),

        isActive: () => {
          return active ?? true;
        },

        isPayLaterAllowed() {
          return payLaterAllowed ?? false;
        },

        configurationError: () => {
          return null;
        },

        charge: async () => {
          return typeof charge === 'function' ? await charge(config, context) : charge;
        },
      };
    },
  });
}
