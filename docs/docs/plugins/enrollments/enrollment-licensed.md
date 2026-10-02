---
sidebar_position: 1
title: Licensed Enrollments
sidebar_label: Licensed
description: Period-based subscription adapter for licensed products
---

# Licensed Enrollments

A subscription adapter for licensed products: access is valid while the current date falls within an enrollment period, and an order is generated at the beginning of each period. Designed for prepaid subscriptions (`isOverdue()` always returns `false`).

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` and `registerAllPlugins()`.
:::

If you register plugins individually instead of using a preset:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { LicensedEnrollmentsPlugin } from '@unchainedshop/plugins/enrollments/licensed';

pluginRegistry.register(LicensedEnrollmentsPlugin);
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.enrollments.licensed` |
| Activation | Plan products with `usageCalculationType: LICENSED` |
| Source | [enrollments/licensed](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/enrollments/licensed) |

## Product Configuration

Create a plan product for licensed subscriptions:

```graphql
mutation CreateSubscriptionProduct {
  createProduct(product: { type: PLAN_PRODUCT }) {
    _id
  }
}

mutation UpdatePlanData {
  updateProductPlan(
    productId: "product-id"
    plan: {
      usageCalculationType: LICENSED
      billingInterval: MONTHS
      billingIntervalCount: 1
    }
  ) {
    _id
    ... on PlanProduct {
      plan {
        usageCalculationType
        billingInterval
      }
    }
  }
}
```

### Minimum Commitment

To enforce a minimum contract term, set `minimumCommitmentPeriods` on the plan. For example, a 12-month commitment on a monthly plan:

```graphql
mutation SetMinimumCommitment {
  updateProductPlan(
    productId: "product-id"
    plan: {
      usageCalculationType: LICENSED
      billingInterval: MONTHS
      billingIntervalCount: 1
      minimumCommitmentPeriods: 12
    }
  ) {
    _id
    ... on PlanProduct {
      plan {
        minimumCommitmentPeriods
      }
    }
  }
}
```

When an enrollment is created for this product, `contractStartDate` and `minimumCommitmentEnd` are computed and stored. If a customer tries to terminate before the commitment ends, the termination is deferred to `minimumCommitmentEnd`. The enrollment fields are queryable:

```graphql
query CheckCommitment {
  enrollment(enrollmentId: "enrollment-id") {
    _id
    contractStartDate
    minimumCommitmentEnd
  }
}
```

## Behavior

- `isValidForActivation()`: `true` while the current date falls within any enrollment period
- `configurationForOrder()`: once a period has started, returns one order position template with `quantity: 1` for the enrolled product; before the period starts, returns `null` (no order generated)
- `isOverdue()`: always `false`
- `terminationDate()`: notice period of one billing interval, so a termination takes effect at the end of the period after the current one
- `transformPlanToNewPlan()`: accepts every plan change; the next period follows the new plan

## Usage

### Create Enrollment

```graphql
mutation CreateEnrollment {
  createEnrollment(
    plan: {
      productId: "plan-product-id"
      quantity: 1
    }
  ) {
    _id
    status
  }
}
```

### Query Enrollments

```graphql
query MyEnrollments {
  me {
    enrollments {
      _id
      status
      isExpired
      plan {
        product {
          texts { title }
        }
      }
      periods {
        start
        end
        isTrial
        order {
          _id
          orderNumber
        }
      }
    }
  }
}
```

### Suspend Enrollment

Suspending an enrollment prevents new orders from being generated. The enrollment remains in `SUSPENDED` status until it is explicitly resumed or until the `resumeAt` date passes. Suspending and resuming require the `manageEnrollments` permission.

```graphql
mutation SuspendSubscription {
  suspendEnrollment(enrollmentId: "enrollment-id") {
    _id
    status
  }
}
```

### Suspend with Scheduled Resume

Pass a `resumeAt` date to automatically resume the enrollment after the specified date:

```graphql
mutation SuspendWithResume {
  suspendEnrollment(
    enrollmentId: "enrollment-id"
    resumeAt: "2026-08-01T00:00:00.000Z"
  ) {
    _id
    status
    resumeAt
  }
}
```

### Resume Enrollment

Resume a suspended enrollment by calling `activateEnrollment`. This clears the `resumeAt` date and returns the enrollment to `ACTIVE` status; a scheduled termination stays.

```graphql
mutation ResumeSubscription {
  activateEnrollment(enrollmentId: "enrollment-id") {
    _id
    status
    resumeAt
  }
}
```

### Terminate Enrollment

With the licensed adapter, termination includes a notice period: the enrollment stays active until the end of the billing period after the current one (or until `minimumCommitmentEnd`, if later). `expires` shows when the termination takes effect.

Optionally provide a cancellation `reason` and `comment` for churn tracking:

```graphql
mutation TerminateSubscription {
  terminateEnrollment(
    enrollmentId: "enrollment-id"
    reason: USER_REQUESTED
    comment: "Switching to a competitor"
  ) {
    _id
    status
    expires
    cancellationReason
    cancellationComment
  }
}
```

### Change Plan

Change the subscription plan on an active enrollment. Billed periods stay as they are; the next period follows the new plan.

```graphql
mutation ChangeSubscriptionPlan {
  updateEnrollment(
    enrollmentId: "enrollment-id"
    plan: {
      productId: "new-plan-product-id"
      quantity: 1
    }
  ) {
    _id
    status
    plan {
      product { _id }
      quantity
    }
  }
}
```

### Set or Clear the End Date

Admins (`manageEnrollments`) set the end date directly, without the notice period or the minimum commitment. The enrollment is terminated when processed after that date (right away for a date that has passed); `expires: null` undoes a scheduled termination.

```graphql
mutation SetEnrollmentExpiry {
  updateEnrollment(
    enrollmentId: "enrollment-id"
    expires: "2026-12-31T00:00:00.000Z"
  ) {
    _id
    expires
  }
}
```

## Automatic Order Generation

The [Enrollment Order Generator Worker](../workers/worker-enrollment-order-generator.md) (part of the `all` preset) schedules order generation automatically; the default schedule fires twice per hour (at minutes 0 and 59). To customize, pass the schedule via the platform options:

```typescript
import { schedule } from '@unchainedshop/core';
import { startPlatform } from '@unchainedshop/platform';

// Run daily at midnight instead
await startPlatform({
  options: {
    enrollments: {
      autoSchedulingSchedule: schedule.parse.cron('0 0 * * *'),
    },
  },
});
```

## Custom Subscription Logic

Use the `registerEnrollment` factory:

```typescript
import { registerEnrollment } from '@unchainedshop/core';

registerEnrollment({
  adapterId: 'metered',
  isActivatedFor: (plan) => plan?.usageCalculationType === 'METERED',

  isValidForActivation: async ({ enrollment }) => {
    const now = Date.now();
    return (enrollment?.periods || []).some(
      (period) =>
        new Date(period.start).getTime() <= now &&
        new Date(period.end).getTime() >= now,
    );
  },

  configurationForOrder: async ({ period }, { enrollment }) => {
    if (!enrollment) return null;
    const usage = await calculateUsage(enrollment._id, period);

    return {
      orderContext: { usage },
      orderPositionTemplates: [{
        quantity: usage.units,
        productId: enrollment.productId,
        originalProductId: enrollment.productId,
        configuration: [{ key: 'usageUnits', value: String(usage.units) }],
      }],
    };
  },
});
```

## Related

- [Enrollment Order Generator](../workers/worker-enrollment-order-generator.md) - Auto-generate orders
- [Custom Enrollment Plugins](../../extend/enrollment.md) - Write your own
