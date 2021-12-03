import {
  PaymentContext,
  PaymentProvider,
  PaymentDirector as IPaymentDirector,
} from '@unchainedshop/types/payments';
import { paymentLogger } from '../payment-logger';
import { PaymentAdapter } from './PaymentAdapter';
import { PaymentError } from './PaymentError';



const Adapters: Map<string, typeof PaymentAdapter> = new Map();

const getFilteredAdapters = (filter) => {
  return Array.from(Adapters)
    .map((entry) => entry[1])
    .filter(filter || (() => true));
};

const registerAdapter = (adapter: typeof PaymentAdapter) => {
  paymentLogger.info(
    `PaymentDirector -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
  );
  Adapters.set(adapter.key, adapter);
};

const getAdapter = (provider: PaymentProvider) => {
  return Adapters.get(provider.adapterKey);
};

const getAdapterInstance = (
  provider: PaymentProvider,
  context: PaymentContext | {}
) => {
  const Adapter = getAdapter(provider);
  if (!Adapter) {
    throw new Error(`Payment Plugin ${provider.adapterKey} not available`);
  }
  return new Adapter(provider.configuration, context);
};

const PaymentDirector = (
  provider: PaymentProvider,
  { transactionContext, token, ...context }: PaymentContext
): IPaymentDirector => ({
  configurationError() {
    try {
      const adapter = getAdapterInstance(provider, context);
      const error = adapter.configurationError();
      return error;
    } catch (error) {
      return PaymentError.ADAPTER_NOT_FOUND;
    }
  },

  isActive() {
    try {
      const adapter = getAdapterInstance(provider, context);
      return adapter.isActive(context);
    } catch (error) {
      paymentLogger.error(error.message);
      return false;
    }
  },

  isPayLaterAllowed() {
    try {
      const adapter = getAdapterInstance(provider, context);
      return adapter.isPayLaterAllowed(context);
    } catch (error) {
      paymentLogger.error(error.message);
      return false;
    }
  },

  async charge(context?: any, userId?: string) {
    const adapter = getAdapterInstance(provider, context);
    return adapter.charge(context || transactionContext, userId);
  },

  async register() {
    const adapter = getAdapterInstance(provider, context);
    return adapter.register(transactionContext);
  },

  async sign() {
    const adapter = getAdapterInstance(provider, context);
    return adapter.sign(transactionContext);
  },

  async validate() {
    const adapter = getAdapterInstance(provider, context);
    const validated = await adapter.validate(token);
    return !!validated;
  },

  async run(command, ...args) {
    const adapter = getAdapterInstance(provider, context);
    return adapter[command](...args);
  },
});

export { getAdapter, getFilteredAdapters, registerAdapter, PaymentDirector };
