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

### Features

- **Period-Based Access**: Access is granted when current date falls within an active period
- **Automatic Order Generation**: Orders are created at the beginning of each period
- **Simple Licensing Model**: One product per enrollment period
- **Termination Notice Period**: Termination takes effect at the end of the next billing period after the current one
- **Minimum Commitment Enforcement**: If the plan has `minimumCommitmentPeriods`, termination is deferred until the commitment period ends
- **Plan Changes**: Supports changing plans on active enrollments, effective after the latest period ends
- **No Overdue Handling**: Designed for prepaid subscriptions

## How It Works

1. Customer purchases a `PLAN_PRODUCT` with `usageCalculationType: LICENSED`
2. Enrollment is created with defined periods
3. At period start, an order is automatically generated
4. Access is valid while current date is within an active period

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

### Check Access

```graphql
query CheckAccess {
  enrollment(enrollmentId: "enrollment-id") {
    _id
    status
    isExpired
  }
}
```

### Suspend Enrollment

Suspending an enrollment prevents new orders from being generated. The enrollment remains in `SUSPENDED` status until it is explicitly resumed or until the `resumeAt` date passes.

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

Resume a suspended enrollment by calling `activateEnrollment`. This clears any pending `requestedTerminationDate` and `resumeAt` date, returning the enrollment to `ACTIVE` status.

```graphql
mutation ResumeSubscription {
  activateEnrollment(enrollmentId: "enrollment-id") {
    _id
    status
    requestedTerminationDate
    resumeAt
  }
}
```

### Terminate Enrollment

With the licensed adapter, termination includes a notice period. The enrollment stays active until the end of the next billing period after the current one. The `requestedTerminationDate` field shows when termination will take effect.

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
    requestedTerminationDate
    cancellationReason
    cancellationComment
  }
}
```

### Cancel at Period End

Instead of computing termination via the adapter's notice period, use `cancelAtPeriodEnd` to simply stop renewing at the end of the current billing period:

```graphql
mutation CancelAtPeriodEnd {
  updateEnrollment(
    enrollmentId: "enrollment-id"
    cancelAtPeriodEnd: true
  ) {
    _id
    requestedTerminationDate
  }
}
```

To undo and continue the subscription:

```graphql
mutation UndoCancelAtPeriodEnd {
  updateEnrollment(
    enrollmentId: "enrollment-id"
    cancelAtPeriodEnd: false
  ) {
    _id
    requestedTerminationDate
  }
}
```

### Change Plan

Change the subscription plan on an active enrollment. The licensed adapter applies the change after the latest existing period ends.

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

### Set Expiry

Set an explicit expiry date on an enrollment. The enrollment will be terminated automatically when processed after this date.

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
