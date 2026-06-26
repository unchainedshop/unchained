import type { PaymentConfiguration } from '@unchainedshop/core-payment';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import {
  type PaymentContext,
  PaymentAdapter,
  type PaymentChargeActionResult,
  type PaymentError,
  type IPlugin,
  type IPaymentAdapter,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerPaymentProvider({
  adapterId,
  type,
  charge,
  sign,
  validate,
  isActive,
  isPayLaterAllowed,
  configurationError,
  cancel,
  confirm,
}: {
  adapterId: string;
  type?: PaymentProviderType;
  charge:
    | false
    | ((
        configuration: PaymentConfiguration,
        context: PaymentContext,
      ) => Promise<PaymentChargeActionResult | false>);
  sign?: (configuration: PaymentConfiguration, context: PaymentContext) => Promise<string | null>;
  validate?: (configuration: PaymentConfiguration, context: PaymentContext) => Promise<boolean>;
  isActive?: boolean;
  isPayLaterAllowed?: boolean;
  configurationError?: PaymentError | null;
  cancel?: (configuration: PaymentConfiguration, context: PaymentContext) => Promise<boolean>;
  confirm?: (configuration: PaymentConfiguration, context: PaymentContext) => Promise<boolean>;
}): IPlugin {
  const providerType = type ?? PaymentProviderType.GENERIC;
  const adapter: IPaymentAdapter = {
    ...PaymentAdapter,

    key: `shop.unchained.payment.${adapterId}`,
    label: 'Payment: ' + adapterId,
    version: '1.0.0',

    initialConfiguration: [],

    typeSupported: (t) => {
      return t === providerType;
    },

    actions: (config, context) => {
      return {
        ...PaymentAdapter.actions(config, context),

        isActive: () => {
          return isActive ?? true;
        },

        isPayLaterAllowed: () => {
          return isPayLaterAllowed ?? false;
        },

        configurationError: () => {
          return configurationError ?? null;
        },

        sign: async () => {
          return sign ? sign(config, context) : null;
        },

        validate: async () => {
          return validate ? validate(config, context) : false;
        },

        cancel: async () => {
          return cancel ? cancel(config, context) : false;
        },

        confirm: async () => {
          return confirm ? confirm(config, context) : false;
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
