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

- Checks all `ACTIVE` and `PAUSED` enrollments
- Determines if a new period should begin using the Enrollment Director
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

1. **Find Enrollments**: Queries all enrollments with status `ACTIVE` or `PAUSED`
2. **Check Period**: Uses the Enrollment Director to determine if a new period should start
3. **Trial Periods**: If the period is a trial, adds the period without creating an order
4. **Order Generation**: For billable periods:
   - Gets configuration from the director
   - Creates an order using the enrollment service
   - Links the order to the enrollment period
5. **Error Handling**: Collects errors for all enrollments and reports them in the result

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
