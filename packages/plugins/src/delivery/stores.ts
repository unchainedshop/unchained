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
      const storesItem = config.find((item) => item.key === 'stores');
      if (!storesItem) return [];

      try {
        return typeof storesItem.value === 'string' ? JSON.parse(storesItem.value) : storesItem.value;
      } catch {
        return storesItem?.value ?? [];
      }
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
