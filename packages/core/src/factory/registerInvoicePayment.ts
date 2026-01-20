import type { PaymentConfiguration } from '@unchainedshop/core-payment';
import {
  type PaymentContext,
  PaymentAdapter,
  type PaymentChargeActionResult,
  type IPlugin,
  type IPaymentAdapter,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
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
}): IPlugin {
  const adapter: IPaymentAdapter = {
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
  };

  const plugin: IPlugin = {
    key: adapter.key,
    label: adapter.label,
    version: adapter.version,
    adapters: [adapter],
  };

  pluginRegistry.register(plugin);
  return plugin;
}
