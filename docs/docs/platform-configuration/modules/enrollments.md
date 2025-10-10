---
sidebar_position: 6
title: Enrollments Options
sidebar_label: Enrollments
---

```typescript
export interface EnrollmentsSettingsOptions {
  autoSchedulingSchedule?: later.ScheduleData;
  enrollmentNumberHashFn?: (enrollment: Enrollment, index: number) => string;
}
```

### Invoice Generator Schedule

Interval that the enrollment generator tries to generate new invoices, default behaviour:

```typescript
import later from '@breejs/later';
const defaultSchedule = later.parse.text('every 59 minutes');
```

This does not control if a new invoice actually is created, that is based on the enrollment plugin implementation and state of the user's enrollment.

### Order Number Creation

The `enrollmentNumberHashFn` is used to generate human-readble codes that can be easily spelled out to support staff. The default is a hashids based function that generates an alphanumeric uppercase string with length 6 without the hard to distinguish 0IOl etc. If the number has already been taken, the function gets iteratively called with an increasing `index`.

[Default Random Hash Generator](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/generate-random-hash.ts)


### Example custom configuration:

```typescript
const options = {
  modules: {
    enrollments: {
      autoSchedulingSchedule: later.parse.text('every 7 days'),
      enrollmentNumberHashFn: (enrollment, try) => (enrollment.sequence + 300000 + try)
    },
  }
};
```
