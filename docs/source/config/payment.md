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
