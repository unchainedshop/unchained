import { IDeliveryAdapter } from '@unchainedshop/types/delivery.js';
import { DeliveryAdapter, DeliveryDirector, DeliveryProviderType } from '@unchainedshop/core-delivery';

const Post: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.post',
  label: 'Manual',
  version: '1.0.0',

  typeSupported: (type) => {
    return type === DeliveryProviderType.SHIPPING;
  },

  actions: (config, context) => {
    return {
      ...DeliveryAdapter.actions(config, context),

      isActive: () => {
        return true;
      },

      configurationError: () => {
        return null;
      },
    };
  },
};

DeliveryDirector.registerAdapter(Post);
