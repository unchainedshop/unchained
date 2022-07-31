---
title: "Module: Payment"
description: Configure the Payment Module
---

- sortProviders: default is `undefined`, this key is deprecated in favor of `filterSupportedProviders`
- filterSupportedProviders: filter payment providers by given custom function or the default which is by creation date
- determineDefaultProvider: set first payment provider from the list of payment providers by default or by given custom function,
Custom sorting of payment providers:

Example of custom function

```
const options = {
  modules: {
    payment: {
      filterSupportedProviders: ({ order, providers }) => {
        return providers
          .sort(
            (left, right) => {
              return new Date(left.created).getTime() - new Date(right.created).getTime();
            }
           );
      },
    },
  }
};
```


Select default provider:

```
const options = {
  modules: {
    payment: {
      determineDefaultProvider: ({ order, providers, paymentCredentials }) => {
        return providers?.find(({ _id }) => _id === "this-id-always-default");
        return null; // Force it to be unselected by returning null
      },
    }
  }
};
```

By default the default provider is defined as first in list of providers matching credentials, if no credentials: first in list of providers (transformed by filterSupportedProviders).