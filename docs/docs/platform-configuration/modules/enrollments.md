---
sidebar_position: 6
title: Enrollments Module
sidebar_label: Enrollments
description: Subscription and recurring order management
---

# Enrollments Module

The enrollments module manages subscriptions and recurring orders.

## Configuration Options

```typescript
import { ScheduleData } from '@unchainedshop/core';

export interface EnrollmentsSettingsOptions {
  autoSchedulingSchedule?: ScheduleData;
  enrollmentNumberHashFn?: (enrollment: Enrollment, index: number) => string;
}
```

### Invoice Generator Schedule

Interval that the enrollment generator tries to generate new invoices, default behaviour:

```typescript
import { schedule } from '@unchainedshop/core';
const defaultSchedule = schedule.parse.text('every 59 minutes');
```

This does not control if a new invoice actually is created, that is based on the enrollment plugin implementation and state of the user's enrollment.

### Enrollment Number Creation

The `enrollmentNumberHashFn` is used to generate human-readable codes that can be easily spelled out to support staff. The default is a hashids based function that generates an alphanumeric uppercase string with length 6 without the hard to distinguish 0IOl etc. If the number has already been taken, the function gets iteratively called with an increasing `index`.

[Default Random Hash Generator](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/generate-random-hash.ts)

### Example Custom Configuration

```typescript
import { schedule } from '@unchainedshop/core';

const options = {
  modules: {
    enrollments: {
      autoSchedulingSchedule: schedule.parse.text('every 7 days'),
      enrollmentNumberHashFn: (enrollment, index) => enrollment.sequence + 300000 + index,
    },
  },
};
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ENROLLMENT_CREATE` | `{ enrollment }` | Emitted when an enrollment is created |
| `ENROLLMENT_UPDATE` | `{ enrollment, field }` | Emitted when an enrollment is updated |
| `ENROLLMENT_REMOVE` | `{ enrollmentId }` | Emitted when an enrollment is removed |
| `ENROLLMENT_ADD_PERIOD` | `{ enrollment }` | Emitted when a period is added to an enrollment |

## More Information

For API usage and detailed documentation, see the [core-enrollments package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-enrollments).
