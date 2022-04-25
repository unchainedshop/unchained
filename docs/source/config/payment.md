---
title: "Module: Payment"
description: Configure the Payment Module
---

Custom sorting of payment providers:

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