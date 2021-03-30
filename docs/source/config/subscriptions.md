---
title: "Module: Subscriptions"
description: Configure the Subscriptions Module
---

Define the interval that the subscription generator tries to generate new invoices, defaults:

```
const options = {
  modules: {
    subscriptions: {
      autoSchedulingSchedule: later.parse.text('every 59 minutes'),
      autoSchedulingInput: {}
    },
  }
};
```
