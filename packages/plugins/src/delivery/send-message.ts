import { IDeliveryAdapter } from '@unchainedshop/types/delivery';
import { DeliveryAdapter, DeliveryDirector, DeliveryProviderType } from '@unchainedshop/core-delivery';

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
        const { modules, order, userId } = context;

        return modules.worker.addWork(
          {
            type: 'MESSAGE',
            retries: 0,
            input: {
              template: 'DELIVERY',
              orderId: order._id,
              config,
            },
          },
          userId,
        );
      },
    };
  },
};

DeliveryDirector.registerAdapter(SendMessage);
