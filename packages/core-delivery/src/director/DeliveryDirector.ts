import {
  DeliveryContext,
  DeliveryProvider,
  DeliveryDirector as IDeliveryDirector,
} from '@unchainedshop/types/delivery';
import { DeliveryAdapter } from './DeliveryAdapter';
import { DeliveryError } from './DeliveryError';
import { log } from 'meteor/unchained:logger';
import { Context } from '@unchainedshop/types/api';

const Adapters: Map<string, typeof DeliveryAdapter> = new Map();

const getAdapters = (filter: (a: typeof DeliveryAdapter) => boolean) => {
  return Array.from(Adapters.values()).filter(filter || (() => true));
};

const registerAdapter = (adapter: typeof DeliveryAdapter) => {
  log(
    `DeliveryDirector -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
  );
  Adapters.set(adapter.key, adapter);
};

const getAdapter = (provider: DeliveryProvider) => {
  return Adapters.get(provider.adapterKey);
};

const getAdapterInstance = (
  provider: DeliveryProvider,
  context: DeliveryContext | {}
) => {
  const Adapter = getAdapter(provider);
  if (!Adapter) {
    throw new Error(`Delivery Plugin ${provider.adapterKey} not available`);
  }
  return new Adapter(provider.configuration, context);
};

const DeliveryDirector = (
  provider: DeliveryProvider,
  deliveryContext: DeliveryContext,
  requestContext: Context
): IDeliveryDirector => {
  const context = { ...deliveryContext, ...requestContext };
  return {
    configurationError() {
      try {
        const adapter = getAdapterInstance(provider, context);
        const error = adapter.configurationError();
        return error;
      } catch (error) {
        return DeliveryError.ADAPTER_NOT_FOUND;
      }
    },

    async estimatedDeliveryThroughput({ warehousingThroughputTime }) {
      try {
        const adapter = getAdapterInstance(provider, context);
        return adapter.estimatedDeliveryThroughput(warehousingThroughputTime);
      } catch (error) {
        console.warn(error); // eslint-disable-line
        return null;
      }
    },

    isActive() {
      try {
        const adapter = getAdapterInstance(provider, context);
        return adapter.isActive();
      } catch (error) {
        console.warn(error); // eslint-disable-line
        return false;
      }
    },

    isAutoReleaseAllowed() {
      try {
        const adapter = getAdapterInstance(provider, context);
        return adapter.isAutoReleaseAllowed();
      } catch (error) {
        console.warn(error); // eslint-disable-line
        return false;
      }
    },

    async send(transactionContext) {
      const adapter = getAdapterInstance(provider, context);
      const sendResult = await adapter.send(transactionContext);
      return sendResult;
    },

    async run(command, ...args) {
      const adapter = getAdapterInstance(provider, context);
      return adapter[command](...args);
    },
  };
};

export { getAdapter, getAdapters, registerAdapter, DeliveryDirector };
