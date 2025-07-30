---
sidebar_position: 3
title: Delivery
sidebar_label: Delivery
---
# Delivery

:::info
Configure the Delivery Module
:::



- filterSupportedProviders: with default filter based on creation date or the developer can provide custom function to filter the providers
- determineDefaultProvider: with default the first provider selected from the list of providers

Adjust detection of available delivery providers:

```
const options = {
  modules: {
    delivery: {
      filterSupportedProviders: ({ order, providers }) => {
        return providers
          .toSorted(
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