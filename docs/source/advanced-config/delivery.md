---
title: "Delivery plugins"
description: Customize delivery 
---

1. Delivery Adapter

In order to register available delivery options, you either have to use the built in ones or have to add a plugin to the supported delivery provider by implementing the [IDeliveryAdapter](https:docs.unchained.shop/types/types/delivery.IDeliveryAdapter.html) interface and registering the adapter on the global [DeliveryDirector](https://docs.unchained.shop/types/types/delivery.IDeliveryDirector.html)

Below we have sample delivery adapter 

```typescript
import { IDeliveryAdapter, DeliveryAdapterActions, DeliveryConfiguration, DeliveryAdapterContext, DeliveryLocation } from "@unchainedshop/types/delivery";
import { Context, DeliveryError } from "@unchainedshop/types/";
import {
  DeliveryAdapter,
  DeliveryDirector,
  DeliveryProviderType,
} from "@unchainedshop/core-delivery";


const ShopPickUp: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'ch.shop.delivery.pickup',
  label: 'Pickup at Clerk',
  version: '1.0',

  initialConfiguration: (DeliveryConfiguration = []),

  typeSupported: (type: DeliveryProviderType): boolean => {
    return type === DeliveryProviderType.PICKUP;
  },

  actions: (config: DeliveryConfiguration, context: DeliveryAdapterContext, requestContext: Context,): DeliveryAdapterActions => {
    return {
      ...DeliveryAdapter.actions(config, context),

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



### DeliveryPriceAdapter

```typescript

import { DeliveryPricingAdapter } from "@unchainedshop/core-delivery";
import type { IDeliveryPricingAdapter } from "@unchainedshop/types/delivery.pricing";


export const ShopDeliveryFreePrice: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.pricing.delivery-fee',
  version: '1.0',
  label: 'shop Delivery',
  orderIndex: 10,

  isActivatedFor: ({ provider }: DeliveryPricingAdapterContext) => {
    return provider.adapterKey === 'ch.shop.delivery.runner';
  },

  actions: (
    params: DeliveryPricingAdapterContext,
    calculationSheet: IDeliveryPricingSheet,
    discounts: Array<Discount>,
  ) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { modules } = params.context;

    return {
      ...pricingAdapter,
      calculate: async (): Promise<Array<Calculation>> => {
        const amount = parseInt(shopTheme.deliveryFeeAmountCHF, 10);
        if (amount > 0) {
          pricingAdapter.resultSheet().addFee({
            amount,
            isNetPrice: false,
            isTaxable: true,
            meta: { adapter: 'delivery-price-key' },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};


```