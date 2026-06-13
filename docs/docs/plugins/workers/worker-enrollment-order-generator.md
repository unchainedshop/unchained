---
sidebar_position: 48
title: Enrollment Order Generator Worker
sidebar_label: Enrollment Orders
description: Automatically generate orders from active enrollments
---

# Enrollment Order Generator Worker

Automatically generates orders from active and paused enrollments based on their configured periods.

## Installation

```typescript
import '@unchainedshop/plugins/worker/enrollment-order-generator';
```

## Purpose

This worker processes enrollments (subscriptions) and:

- Checks all `ACTIVE`, `PAUSED`, and `SUSPENDED` enrollments
- Processes each enrollment's status (handles scheduled terminations, expiry checks)
- Skips order generation for `TERMINATED` and `SUSPENDED` enrollments
- Determines if a new period should begin using the Enrollment Director
- Skips periods that start after the enrollment's `expires` date
- Creates trial periods without orders
- Generates orders for billable periods
- Tracks periods on the enrollment

## Auto-Scheduling

To enable automatic order generation, configure the scheduling in your platform setup:

```typescript
import { configureGenerateOrderAutoscheduling } from '@unchainedshop/plugins/worker/enrollment-order-generator';
import { enrollmentsSettings } from '@unchainedshop/core-enrollments';

// Configure the schedule (e.g., daily at midnight)
enrollmentsSettings.autoSchedulingSchedule = later.parse.cron('0 0 * * *');

// Enable auto-scheduling
configureGenerateOrderAutoscheduling();
```

## Manual Trigger

You can also trigger order generation manually:

```graphql
mutation GenerateEnrollmentOrders {
  addWork(type: ENROLLMENT_ORDER_GENERATOR) {
    _id
    status
  }
}
```

## How It Works

1. **Find Enrollments**: Queries all enrollments with status `ACTIVE`, `PAUSED`, or `SUSPENDED`
2. **Process Status**: Runs `processEnrollment` on each enrollment to handle scheduled terminations and expiry
3. **Skip Inactive**: Enrollments that are now `TERMINATED` or `SUSPENDED` after processing are skipped
4. **Check Period**: Uses the Enrollment Director to determine if a new period should start
5. **Expiry Check**: Skips periods where the start date is at or after the enrollment's `expires` date
6. **Trial Periods**: If the period is a trial, adds the period without creating an order. If the trial ends within 3 days, emits an `ENROLLMENT_TRIAL_ENDING` event for notification purposes.
7. **Auto-Resume**: Suspended enrollments with a past `resumeAt` date are automatically resumed to `ACTIVE` during status processing (step 2).
8. **Order Generation**: For billable periods:
   - Gets configuration from the director
   - Creates an order using the enrollment service
   - Links the order to the enrollment period
8. **Error Handling**: Collects errors for all enrollments and reports them in the result

## Result

### Success

```json
{
  "success": true
}
```

### Partial Failure

```json
{
  "success": false,
  "error": {
    "name": "SOME_ENROLLMENTS_COULD_NOT_PROCESS",
    "message": "Some errors have been reported during order generation",
    "logs": [
      { "name": "Error", "message": "Product not found" }
    ]
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.generate-enrollment-orders` |
| Type | `ENROLLMENT_ORDER_GENERATOR` |
| Retries | 5 (when auto-scheduled) |
| Source | [worker/enrollment-order-generator.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/enrollment-order-generator.ts) |

## Related

- [Enrollments Module](../../platform-configuration/modules/enrollments.md)
- [Plugins Overview](./)
