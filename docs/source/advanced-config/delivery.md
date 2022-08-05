---
title: "Delivery plugins"
description: Customize delivery 
---

## 1. DeliveryAdapter

In order to register available delivery options, you either have to use the built in ones or have to add a plugin to the supported delivery provider by implementing the [IDeliveryAdapter](https:docs.unchained.shop/types/types/delivery.IDeliveryAdapter.html) interface and registering the adapter on the global [DeliveryDirector](https://docs.unchained.shop/types/types/delivery.IDeliveryDirector.html)

Below we have sample delivery adapter 

```typescript
import { IDeliveryAdapter, DeliveryAdapterActions, DeliveryConfiguration, DeliveryAdapterContext, DeliveryLocation } from "@unchainedshop/types/delivery";
import { Context, DeliveryError } from "@unchainedshop/types/";
import {
  DeliveryDirector,
  DeliveryProviderType,
} from "@unchainedshop/core-delivery";


const ShopPickUp: IDeliveryAdapter = {
  key: 'ch.shop.delivery.pickup',
  label: 'Pickup at Clerk',
  version: '1.0',

  initialConfiguration: (DeliveryConfiguration = []),

  typeSupported: (type: DeliveryProviderType): boolean => {
    return type === DeliveryProviderType.PICKUP;
  },

  actions: (config: DeliveryConfiguration, context: DeliveryAdapterContext, requestContext: Context,): DeliveryAdapterActions => {
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
        const { modules, order, userId } = context as typeof context;
        await modules.worker.addWork(
          {
            type: 'MARK_ORDER_DELIVERED',
            retries: 0,
            scheduled: new Date(new Date().getTime() + 1000 * (24 * 60 * 60)),
            input: {
              orderDeliveryId: order.deliveryId,
            },
          },
          userId,
        );

        return false;
      },
    };
  },
};
```

- `configurationError(transactionContext: any)`: returns any issue found with the delivery adapter configuration.  its passed current transaction object that lets you check if everything is working for proper functioning of the adapter.
- `estimatedDeliveryThroughput(warehousingThroughputTime: number)`: Used to send an estimation delivery time of the adapter.
- `isActive`: Used to enable or disable the adapter.
- `isAutoReleaseAllowed`: Determined if the delivery provider should change status automatically or if manual confirmation of delivery is required.
- `pickUpLocationById(locationId: string)`: returns a delivery location with the specified ID from the list of locations returned from `pickUpLocations`.
- `pickUpLocations` returns list of delivery locations available with a particular delivery adapter
- `send`: Determines the if an order is delivered or not. if this function returns true the order delivery status will be changed to **DELIVERED**, if it returns false order delivery status stays the same (PENDING) but the order status can be changed but if it throws an error the order will be canceled.



## 2. DeliveryPriceAdapter

Delivery pricing adapter is used to do the actual delivery cost calculation. The adapter is run for every single item included in an order.

```typescript

import {
  DeliveryPricingAdapter,
  DeliveryPricingSheet,
  IDeliveryPricingSheet,
} from '@unchainedshop/core-delivery';
import { DeliveryPricingAdapterContext, Calculation, PricingAdapterContext } from '@unchainedshop/types';
import type { IDeliveryPricingAdapter } from '@unchainedshop/types/delivery.pricing';
import { Discount } from '@unchainedshop/types/discount';

export const ShopDeliveryFreePrice: IDeliveryPricingAdapter = {
  key: 'shop.pricing.delivery-fee',
  version: '1.0',
  label: 'shop Delivery',
  orderIndex: 10,

  isActivatedFor: ({ provider }: DeliveryPricingAdapterContext) => {
    return provider.adapterKey === 'ch.shop.delivery.runner';
  },

  actions: (
    context: DeliveryPricingAdapterContext,
    calculationSheet: IDeliveryPricingSheet,
    discounts: Array<Discount>,
  ): IPricingAdapterActions<Calculation, DeliveryPricingAdapterContext> & {
    resultSheet: () => IDeliveryPricingSheet;
  } => {
    const calculation = [];
    const { currency } = context;
    const resultSheet = DeliveryPricingSheet({ currency });
    return {
      getCalculation: (): Calculation[] => calculation,
      getContext: (): PricingAdapterContext => context,
      calculate: async (): Promise<Calculation[]> => {
        resultSheet.addFee({
          amount: 50,
          isNetPrice: false,
          isTaxable: true,
          meta: { adapter: 'delivery-price-key' },
        });
        return resultSheet.calculate();
      },
    };
  },
};


```

- `isActivatedFor`: defines to which delivery adapters this delivery price adapter calculations should take place.
- `getCalculation`: returns all the fees that will are included for calculation through the adapter.
- `getContext`: returns the pricing adapter context
- `calculate`: calculated the delivery price based on the the logic provided and returns the calculation breakdown (result sheet)