import {
  DeliveryConfiguration,
  DeliveryLocation,
  DeliveryProviderType,
} from '@unchainedshop/core-delivery';
import { DeliveryAdapter, DeliveryContext, DeliveryDirector } from '../core-index.js';
import { Work } from '@unchainedshop/core-worker';

export default function registerPickUpDelivery({
  adapterId,
  locations,
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
  locations: DeliveryLocation[] | ((context: DeliveryContext) => Promise<DeliveryLocation[]>);
}) {
  DeliveryDirector.registerAdapter({
    ...DeliveryAdapter,

    key: `shop.unchained.delivery.pickup-${adapterId}`,
    label: 'PickUp Delivery: ' + adapterId,
    version: '1.0.0',

    initialConfiguration: [],

    typeSupported: (type) => {
      return type === DeliveryProviderType.PICKUP;
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

        pickUpLocationById: async (id) => {
          const result = typeof locations === 'function' ? await locations(context) : locations;
          return result.find((location) => location._id === id) || null;
        },

        pickUpLocations: async () => {
          const result = typeof locations === 'function' ? await locations(context) : locations;
          return result;
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
