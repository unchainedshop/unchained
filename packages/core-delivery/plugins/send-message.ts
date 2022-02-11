import { IDeliveryAdapter } from '@unchainedshop/types/delivery';
import { DeliveryAdapter, DeliveryDirector, DeliveryProviderType } from 'meteor/unchained:core-delivery';

const SendMessage: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.delivery.send-message',
  label: 'Forward Delivery via Messaging',
  version: '1.0',

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

      isActive: async () => {
        return true;
      },

      configurationError: async () => {
        return null;
      },

      send: async (transactionContext) => {
        const { modules, order, userId } = context;

        return modules.worker.addWork(
          {
            type: 'MESSAGE',
            retries: 0,
            input: {
              template: 'DELIVERY',
              orderId: order._id,
              config,
              transactionContext,
            },
          },
          userId,
        );
      },
    };
  },
};

DeliveryDirector.registerAdapter(SendMessage);
