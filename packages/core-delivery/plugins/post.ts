import { IDeliveryAdapter } from '@unchainedshop/types/delivery';
import { DeliveryAdapter, DeliveryDirector, DeliveryProviderType } from 'meteor/unchained:core-delivery';

const Post: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.post',
  label: 'Post (Manual)',
  version: '1.0',

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
