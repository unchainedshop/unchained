---
title: 'Module: Enrollments'
description: Configure the Enrollments Module
---

Define the interval that the enrollment generator tries to generate new invoices, defaults:

```
const options = {
  modules: {
    enrollments: {
      autoSchedulingSchedule: later.parse.text('every 59 minutes'),
      autoSchedulingInput: {}
    },
  }
};
```
