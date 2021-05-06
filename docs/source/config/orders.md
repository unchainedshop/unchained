---
title: "Module: Orders"
description: Configure the Orders Module
---

Enable experimental function that tries to ensure that any user always has an open cart:

```
const options = {
  modules: {
    orders: {
      ensureUserHasCart: true
    },
  }
};
```
