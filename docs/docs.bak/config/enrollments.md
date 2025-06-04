---
sidebar_position: 4
title: Enrollments
sidebar_label: Enrollments
---
:::info
Configure the Enrollments Module
:::


- autoSchedulingSchedule: `object` Interval that the enrollment generator tries to generate new invoices, default is `later.parse.text('every 59 minutes')`
- enrollmentNumberHashFn: `(enrollment: Enrollment, try: int) => string | number` function to retrieve a unique generated enrollmentNumber, default is a hashids based function that generates an alphanumeric uppercase string with length 6. If the number has already been taken, the function gets iteratively called with an increasing `try`

Example custom configuration:

```
const options = {
  modules: {
    enrollments: {
      autoSchedulingSchedule: later.parse.text('every 7 days'),
      enrollmentNumberHashFn: (enrollment, try) => (enrollment.sequence + 300000 + try)
    },
  }
};
```
