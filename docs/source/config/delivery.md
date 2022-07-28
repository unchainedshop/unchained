---
title: 'Module: Delivery'
description: Configure the Delivery Module
---

- sortProviders: with default `undefined`,
- filterSupportedProviders
- determineDefaultProvider

Adjust detection of available delivery providers:

```
const options = {
  modules: {
    delivery: {
      filterSupportedProviders: ({ order, providers }) => {
        return providers
          .sort(
            (left, right) => {
              return new Date(left.created).getTime() - new Date(right.created).getTime();
            }
            );
      },
    }
  }
};
```

Select default provider:

```
const options = {
  modules: {
    delivery: {
      determineDefaultProvider: ({ order, providers }) => {
        return providers?.find(({ _id }) => _id === "this-id-always-default");
        return null; // Force unselected like this
      },
    }
  }
};
```

By default the default provider is defined as first in list of providers (transformed by filterSupportedProviders)
