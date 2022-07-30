

```typescript
import { IDeliveryAdapter } from "@unchainedshop/types/delivery";
import {
  DeliveryAdapter,
  DeliveryDirector,
  DeliveryProviderType,
} from "meteor/unchained:core-delivery";
import { AppContext } from "../types/app-context";


const d
const OrderlyPickup: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: "ch.orderly.delivery.pickup",
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