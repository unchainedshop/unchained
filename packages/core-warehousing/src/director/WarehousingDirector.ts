import {
  WarehousingContext,
  WarehousingProvider,
  WarehousingDirector as IWarehousingDirector,
} from '@unchainedshop/types/warehousing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { WarehousingAdapter } from './WarehousingAdapter';
import { WarehousingError } from './WarehousingError';

const Adapters: Map<string, typeof WarehousingAdapter> = new Map();

const getFilteredAdapters = (filter) => {
  return Array.from(Adapters)
    .map((entry) => entry[1])
    .filter(filter || (() => true));
};

const registerAdapter = (adapter: typeof WarehousingAdapter) => {
  log(
    `WarehousingDirector -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
  );
  Adapters.set(adapter.key, adapter);
};

const getAdapter = (provider: WarehousingProvider) => {
  return Adapters.get(provider.adapterKey);
};

const getAdapterInstance = (
  provider: WarehousingProvider,
  context: WarehousingContext
) => {
  const Adapter = getAdapter(provider);
  if (!Adapter) {
    throw new Error(`Warehousing Plugin ${provider.adapterKey} not available`);
  }
  return new Adapter(provider.configuration, context);
};

const getReferenceDate = (context: WarehousingContext) => {
  return context && context.referenceDate ? context.referenceDate : new Date();
};

const WarehousingDirector = (
  provider: WarehousingProvider
): IWarehousingDirector => {
  const throughputTime = async (context: WarehousingContext) => {
    try {
      const adapter = getAdapterInstance(provider, {});
      const { quantity } = context;
      const referenceDate = getReferenceDate(context);
      const stock = (await adapter.stock(referenceDate).catch(() => 0)) || 0;
      const notInStockQuantity = Math.max(quantity - stock, 0);
      const productionTime = await adapter.productionTime(notInStockQuantity);
      const commissioningTime = await adapter.commissioningTime(quantity);
      return Math.max(commissioningTime + productionTime, 0);
    } catch (error) {
      log(error.message, { level: LogLevel.Error, ...error });
      return 0;
    }
  };

  return {
    configurationError() {
      try {
        const adapter = getAdapterInstance(provider, {});
        const error = adapter.configurationError();
        return error;
      } catch (error) {
        return WarehousingError.ADAPTER_NOT_FOUND;
      }
    },

    isActive(context: WarehousingContext) {
      try {
        const adapter = getAdapterInstance(provider, context);
        return adapter.isActive();
      } catch (error) {
        log(error.message, { level: LogLevel.Error });
        return false;
      }
    },

    throughputTime,

    async estimatedStock(context: WarehousingContext) {
      try {
        const adapter = getAdapterInstance(provider, {});
        const referenceDate = getReferenceDate(context);
        const quantity = await adapter.stock(referenceDate);
        return {
          quantity,
        };
      } catch (error) {
        log(error.message, { level: LogLevel.Error, ...error });
        return null;
      }
    },

    async estimatedDispatch(context) {
      try {
        const { deliveryProvider } = context;
        const referenceDate = getReferenceDate(context);
        const warehousingThroughputTime = await throughputTime(context);
        const deliveryThroughputTime =
          deliveryProvider.estimatedDeliveryThroughput({
            ...context,
            warehousingThroughputTime,
          });
        const shippingTimestamp =
          referenceDate.getTime() + warehousingThroughputTime;
        const earliestDeliveryTimestamp =
          deliveryThroughputTime !== null
            ? shippingTimestamp + deliveryThroughputTime
            : null;

        return {
          shipping: shippingTimestamp && new Date(shippingTimestamp),
          earliestDelivery:
            earliestDeliveryTimestamp && new Date(earliestDeliveryTimestamp),
        };
      } catch (error) {
        log(error.message, { level: LogLevel.Error, ...error });
        return {};
      }
    },
  };
};

export {
  getAdapter,
  getFilteredAdapters,
  registerAdapter,
  WarehousingDirector,
};
