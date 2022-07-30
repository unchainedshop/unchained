
---
title: "Delivery plugins"
description: Customize delivery 
---

```typescript
import { IDeliveryAdapter } from "@unchainedshop/types/delivery";
import {
  DeliveryAdapter,
  DeliveryDirector,
  DeliveryProviderType,
} from "meteor/unchained:core-delivery";
import { AppContext } from "../types/app-context";

const ShopPickUp: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: "ch.shop.delivery.pickup",
  label: "Pickup at Clerk",
  version: "1.0",

  initialConfiguration: DeliveryConfiguration =  [],

  typeSupported: (type: DeliveryProviderType): boolean =>  {
    return type === DeliveryProviderType.PICKUP;
  },

  actions: (config: DeliveryConfiguration, context: DeliveryAdapterContext): DeliveryAdapterActions => {
    return {
      ...DeliveryAdapter.actions(config, context),

      isAutoReleaseAllowed() {
        return false;
      },

      isActive() {
        return true;
      },

      configurationError(transactionContext?: any): DeliveryError {
        return null;
      },

      pickUpLocationById(locationId: string): Promise<DeliveryLocation> {
            return this.pickUpLocations().filter(({_id}) => _id === locationId )
      },

      pickUpLocations():Promise<Array<DeliveryLocation>> {
        return [{
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
  }}
  ]
      }
      ,

      send: async () => {
        const { modules, order, userId } = context as typeof context
        await modules.worker.addWork(
          {
            type: "MARK_ORDER_DELIVERED",
            retries: 0,
            scheduled: new Date(new Date().getTime() + 1000 * (24 * 60 * 60)),
            input: {
              orderDeliveryId: order.deliveryId,
            },
          },
          userId
        );

        return false;
      },
    };
  },
};

```



### DeliveryPriceAdapter

```typescript

import {
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
} from "meteor/unchained:core-delivery";
import type { IDeliveryPricingAdapter } from "@unchainedshop/types/delivery.pricing";


export const ShopDeliveryFreePrice: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: "shop.pricing.delivery-fee",
  version: "1.0",
  label: "shop Delivery",
  orderIndex: 10,

  isActivatedFor: ({ provider }: DeliveryPricingAdapterContext) => {
    return provider.adapterKey === "ch.shop.delivery.runner";
  },

  actions: (params: DeliveryPricingAdapterContext) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { modules } = params.context

    return {
      ...pricingAdapter,
      calculate: async () => {
        const amount = parseInt(shopTheme.deliveryFeeAmountCHF, 10);
        if (amount > 0) {
          pricingAdapter.resultSheet().addFee({
            amount,
            isNetPrice: false,
            isTaxable: true,
            meta: { adapter: 'delivery-price-key },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};


```