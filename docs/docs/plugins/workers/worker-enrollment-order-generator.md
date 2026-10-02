---
sidebar_position: 48
title: Enrollment Order Generator Worker
sidebar_label: Enrollment Orders
description: Automatically generate orders from active enrollments
---

# Enrollment Order Generator Worker

Automatically generates orders from active and paused enrollments based on their configured periods.

:::info Included in All Preset
Registered automatically by `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { EnrollmentOrderGeneratorPlugin } from '@unchainedshop/plugins/worker/enrollment-order-generator';

pluginRegistry.register(EnrollmentOrderGeneratorPlugin);
```

## Purpose

This worker processes enrollments (subscriptions) and:

- Checks all `ACTIVE`, `PAUSED` and `SUSPENDED` enrollments
- Applies scheduled terminations, expiries and resumes first
- Emits `ENROLLMENT_TRIAL_ENDING` once per trial that ends soon
- Determines if a new period should begin using the Enrollment Director
- Creates trial periods without orders
- Generates orders for billable periods
- Tracks periods on the enrollment

## Auto-Scheduling

Auto-scheduling is configured on registration from `enrollmentsSettings.autoSchedulingSchedule` (from `@unchainedshop/core-enrollments`), which defaults to an hourly schedule.

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

1. **Find Enrollments**: Queries all enrollments with status `ACTIVE`, `PAUSED` or `SUSPENDED`
2. **Process Status**: Runs `processEnrollment`, which terminates enrollments past their `expires` and resumes suspended ones past their `resumeAt`. Enrollments that are `TERMINATED` or `SUSPENDED` afterwards are skipped
3. **Trial Ending**: Emits `ENROLLMENT_TRIAL_ENDING` once when a trial period ends within `trialEndingNoticeDays` (default 3)
4. **Check Period**: Uses the Enrollment Director to determine if a new period should start
5. **Trial Periods**: If the period is a trial, adds the period without creating an order
6. **Order Generation**: For billable periods:
   - Gets configuration from the director
   - Creates an order using the enrollment service
   - Links the order to the enrollment period
7. **Error Handling**: Collects errors for all enrollments and reports them in the result

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
| Source | [worker/enrollment-order-generator](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/enrollment-order-generator) |

## Related

- [Enrollments Module](../../platform-configuration/modules/enrollments.md)
- [Plugins Overview](./)
