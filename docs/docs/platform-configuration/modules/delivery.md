---
sidebar_position: 3
title: Delivery Options
sidebar_label: Delivery
---

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
          .toSorted(
            (left, right) => {
              return new Date(left.created).getTime() - new Date(right.created).getTime();
            }
           ).filter(provider => {
            return process.env.NODE_ENV === 'production' ? provider._id_ !== 'free' : true;
           });
      },
    },
  }
};
```

By default we return all providers based on the creation date and don't filter any. You can't return inactive delivery providers in general.


### Default Provider selection for new orders

```typescript
const options = {
  modules: {
    delivery: {
      determineDefaultProvider: ({ order, providers }) => {
        return providers?.find(({ _id }) => _id === "this-id-always-default");
      },
    }
  }
};
```

By default the default provider is defined as first in list of providers (transformed by `filterSupportedProviders` first).
