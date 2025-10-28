import { DeliveryConfiguration, DeliveryProviderType } from '@unchainedshop/core-delivery';
import { DeliveryAdapter, DeliveryContext, DeliveryDirector } from '../core-index.js';
import { Work } from '@unchainedshop/core-worker';

export default function registerShippingDelivery({
  adapterId,
  active,
  autoReleaseAllowed,
  estimatedDeliveryThroughput,
  send,
}: {
  adapterId: string;
  active?: boolean;
  autoReleaseAllowed?: boolean;
  estimatedDeliveryThroughput?: (
    warehousingThroughputTime: number,
    context: DeliveryContext,
  ) => Promise<number | null>;
  send:
    | boolean
    | ((configuration: DeliveryConfiguration, context: DeliveryContext) => Promise<boolean | Work>);
}) {
  DeliveryDirector.registerAdapter({
    ...DeliveryAdapter,

    key: `shop.unchained.delivery.shipping-${adapterId}`,
    label: 'Shipping Delivery: ' + adapterId,
    version: '1.0.0',

    initialConfiguration: [],

    typeSupported: (type) => {
      return type === DeliveryProviderType.SHIPPING;
    },

    actions: (config, context) => {
      return {
        ...DeliveryAdapter.actions(config, context),

        isActive: () => {
          return active ?? true;
        },

        isAutoReleaseAllowed: () => {
          return autoReleaseAllowed ?? true;
        },

        configurationError: () => {
          return null;
        },

        estimatedDeliveryThroughput: async (warehousingThroughputTime) => {
          if (estimatedDeliveryThroughput) {
            return estimatedDeliveryThroughput(warehousingThroughputTime, context);
          }
          return 0;
        },

        send: async () => {
          return typeof send === 'function' ? await send(config, context) : send;
        },
      };
    },
  });
}
