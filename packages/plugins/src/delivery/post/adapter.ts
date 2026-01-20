import { type IDeliveryAdapter, DeliveryAdapter } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

export const Post: IDeliveryAdapter = {
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
