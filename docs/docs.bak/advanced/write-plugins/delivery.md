---
sidebar_position: 2
sidebar_label: Delivery
title: Delivery Providers
---
:::info
Customize delivery
:::
---
title: "Delivery Providers"
description: Customize delivery 
---

In order to register available delivery options, you either have to use the builtin ones or have to add a plugin to the supported delivery provider by implementing the [IDeliveryAdapter](https://docs.unchained.shop/types/types/delivery.IDeliveryAdapter.html) interface and registering the adapter on the global [DeliveryDirector](https://docs.unchained.shop/types/types/delivery.IDeliveryDirector.html)

There can be multiple delivery adapter implementation for a shop and all of them will be executed based on their `orderIndex` value. Delivery adapters with lowe `orderIndex` are executed first.

Below we have sample delivery adapter 

```typescript
import {
  DeliveryDirector,
  DeliveryProviderType,
} from "@unchainedshop/core-delivery";


const ShopPickUp: IDeliveryAdapter = {
  key: 'ch.shop.delivery.pickup',
  label: 'Pickup at Clerk',
  version: '1.0.0',
  orderIndex: 1
  initialConfiguration: (DeliveryConfiguration = []),

  typeSupported: (type: DeliveryProviderType): boolean => {
    return type === DeliveryProviderType.PICKUP;
  },

  actions: (config: DeliveryConfiguration, context: DeliveryAdapterContext, unchainedAPI: UnchainedCore): DeliveryAdapterActions => {
    return {
      isAutoReleaseAllowed(): boolean {
        return false;
      },

      isActive(): boolean {
        return true;
      },

      configurationError(transactionContext?: any): DeliveryError {
        return null;
      },

      pickUpLocationById(locationId: string): Promise<DeliveryLocation> {
        return this.pickUpLocations().filter(({ _id }) => _id === locationId);
      },

      estimatedDeliveryThroughput: (warehousingThroughputTime: number) : Promise<number>  => {
        return 0;
      },

      pickUpLocations(): Promise<Array<DeliveryLocation>> {
        return [
          {
            _id: 'first-location-id',
            name: 'first-location',
            address: {
              addressLine: 'address-line',
              postalCode: '1234',
              countryCode: 'CH',
              city: 'Zurich',
            },
            geoPoint: {
              latitude: 123456789,
              longitude: 987654321,
            },
          },
        ];
      },
      send: async (): Promise<boolean | Work> => {
        const { modules, order } = context as typeof context;
        await modules.worker.addWork(
          {
            type: 'MARK_ORDER_DELIVERED',
            retries: 0,
            scheduled: new Date(new Date().getTime() + 1000 * (24 * 60 * 60)),
            input: {
              orderDeliveryId: order.deliveryId,
            },
          },
        );

        return false;
      },
    };
  },
};
```

- **typeSupported(type: [DeliveryProviderType](https://docs.unchained.shop/types/enums/delivery.DeliveryProviderType.html))**: Defines which type of delivery providers this adapter support.
- **configurationError(transactionContext: any): [DeliveryError](https://docs.unchained.shop/types/enums/delivery.DeliveryError.html)**: returns any issue found with the delivery adapter configuration.  its passed current transaction object that lets you check if everything is working for proper functioning of the adapter.
- **estimatedDeliveryThroughput(warehousingThroughputTime: number)**: Used to send an estimation delivery time of the adapter.
- **isActive**: Used to enable or disable the adapter.
- **isAutoReleaseAllowed**: Determined if the delivery provider should change status automatically or if manual confirmation of delivery is required.
- **pickUpLocationById(locationId: string): [DeliveryLocation](https://docs.unchained.shop/types/interfaces/delivery.DeliveryLocation.html)**: returns a delivery location with the specified ID from the list of locations returned from `pickUpLocations`.
- **pickUpLocations: [DeliveryLocation](https://docs.unchained.shop/types/interfaces/delivery.DeliveryLocation.html)[]** returns list of delivery locations available with a particular delivery adapter
- **send: any**: Determines the if an order is delivered or not. if this function returns a trueish value the order delivery status will be changed to **DELIVERED**, if it returns false order delivery status stays the same (PENDING) but the order status can be changed but if it throws an error the order will be canceled.