import { type IDeliveryAdapter, DeliveryAdapter } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

export const Download: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.delivery.download',
  label: 'Download',
  version: '1.0.0',

  typeSupported: (type) => {
    return type === DeliveryProviderType.DOWNLOAD;
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
