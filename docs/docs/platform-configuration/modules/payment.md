---
sidebar_position: 4
title: Payment Options
sidebar_label: Payment
---

```typescript
export type FilterProvider = (
  params: {
    providers: PaymentProvider[];
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<PaymentProvider[]>;

export type DetermineDefaultProvider = (
  params: {
    providers: PaymentProvider[];
    paymentCredentials: PaymentCredentials[];
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<PaymentProvider | null>;

export interface PaymentSettingsOptions {
  filterSupportedProviders?: FilterProviders;
  determineDefaultProvider?: DetermineDefaultProvider;
}
```

### Custom Filtering

```typescript
const options = {
  modules: {
    payment: {
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

By default we return all providers based on the creation date and don't filter any. You can't return inactive payment providers in general.


### Default Provider selection for new orders

```typescript
const options = {
  modules: {
    payment: {
      determineDefaultProvider: ({ order, providers }) => {
        return providers?.find(({ _id }) => _id === "this-id-always-default");
      },
    }
  }
};
```

By default the default provider is defined as first in list of providers matching credentials, if no credentials: first in list of providers (transformed by `filterSupportedProviders` first).


