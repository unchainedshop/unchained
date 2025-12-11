---
sidebar_position: 3
title: Delivery Module
sidebar_label: Delivery
description: Delivery provider configuration and filtering
---

# Delivery Module

The delivery module manages delivery provider selection and configuration.

## Configuration Options

```typescript
export type FilterProvider = (
  params: {
    providers: DeliveryProvider[];
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<DeliveryProvider[]>;

export type DetermineDefaultProvider = (
  params: {
    providers: DeliveryProvider[];
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<DeliveryProvider | null>;

export interface DeliverySettingsOptions {
  filterSupportedProviders?: FilterProviders;
  determineDefaultProvider?: DetermineDefaultProvider;
}
```

### Custom Filtering

```typescript
const options = {
  modules: {
    delivery: {
      filterSupportedProviders: ({ order, providers }) => {
        return providers
          .toSorted((left, right) => {
            return new Date(left.created).getTime() - new Date(right.created).getTime();
          })
          .filter((provider) => {
            return process.env.NODE_ENV === 'production' ? provider._id !== 'free' : true;
          });
      },
    },
  },
};
```

By default we return all providers based on the creation date and don't filter any. You can't return inactive delivery providers in general.

### Default Provider Selection for New Orders

```typescript
const options = {
  modules: {
    delivery: {
      determineDefaultProvider: ({ order, providers }) => {
        return providers?.find(({ _id }) => _id === 'this-id-always-default');
      },
    },
  },
};
```

By default the default provider is defined as first in list of providers (transformed by `filterSupportedProviders` first).

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `DELIVERY_PROVIDER_CREATE` | `{ deliveryProvider }` | Emitted when a delivery provider is created |
| `DELIVERY_PROVIDER_UPDATE` | `{ deliveryProvider }` | Emitted when a delivery provider is updated |
| `DELIVERY_PROVIDER_REMOVE` | `{ deliveryProvider }` | Emitted when a delivery provider is removed |

## More Information

For API usage and detailed documentation, see the [core-delivery package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-delivery).
