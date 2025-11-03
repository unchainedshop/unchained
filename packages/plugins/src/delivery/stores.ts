import { DeliveryAdapter, DeliveryDirector, IDeliveryAdapter } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

const PickMup: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.stores',
  label: 'Pre-configured Stores',
  version: '1.0.0',

  typeSupported: (type) => {
    return type === DeliveryProviderType.PICKUP;
  },

  actions: (config, context) => {
    const getStores = () => {
      return config.reduce((current, item) => {
        if (item.key === 'stores') return JSON.parse(JSON.stringify(item.value));
        return current;
      }, []);
    };

    return {
      ...DeliveryAdapter.actions(config, context),

      isActive() {
        return true;
      },

      isAutoReleaseAllowed() {
        return false;
      },

      configurationError() {
        return null;
      },

      pickUpLocationById: async (id) => {
        return getStores().find((store) => store._id === id);
      },

      pickUpLocations: async () => {
        return getStores();
      },
    };
  },
};

DeliveryDirector.registerAdapter(PickMup);
