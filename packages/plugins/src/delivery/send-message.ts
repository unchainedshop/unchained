import { DeliveryAdapter, DeliveryDirector, IDeliveryAdapter } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

const SendMessage: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.delivery.send-message',
  label: 'Forward via Messaging',
  version: '1.0.0',

  initialConfiguration: [
    { key: 'from', value: '' },
    { key: 'to', value: '' },
    { key: 'cc', value: '' },
  ],

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

      send: async () => {
        const { modules, order } = context;

        return modules.worker.addWork({
          type: 'MESSAGE',
          retries: 0,
          input: {
            template: 'DELIVERY',
            orderId: order._id,
            config,
          },
        });
      },
    };
  },
};

DeliveryDirector.registerAdapter(SendMessage);
