---
title: "Module: Delivery"
description: Configure the Delivery Module
---

Custom sorting of delivery providers:

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
            )
          .map(({ _id }) => _id);
      },
    }
  }
};
```
