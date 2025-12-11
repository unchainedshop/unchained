---
sidebar_position: 4
title: Payment Module
sidebar_label: Payment
description: Payment provider configuration and filtering
---

# Payment Module

The payment module manages payment provider selection and configuration.

## Configuration Options

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

By default we return all providers based on the creation date and don't filter any. You can't return inactive payment providers in general.

### Default Provider Selection for New Orders

```typescript
const options = {
  modules: {
    payment: {
      determineDefaultProvider: ({ order, providers }) => {
        return providers?.find(({ _id }) => _id === 'this-id-always-default');
      },
    },
  },
};
```

By default the default provider is defined as first in list of providers matching credentials, if no credentials: first in list of providers (transformed by `filterSupportedProviders` first).

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `PAYMENT_PROVIDER_CREATE` | `{ paymentProvider }` | Emitted when a payment provider is created |
| `PAYMENT_PROVIDER_UPDATE` | `{ paymentProvider }` | Emitted when a payment provider is updated |
| `PAYMENT_PROVIDER_REMOVE` | `{ paymentProvider }` | Emitted when a payment provider is removed |

## More Information

For API usage and detailed documentation, see the [core-payment package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-payment).
