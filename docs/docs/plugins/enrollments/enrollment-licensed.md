---
sidebar_position: 1
title: Licensed Enrollments
sidebar_label: Licensed
description: Period-based subscription adapter for licensed products
---

# Licensed Enrollments

A subscription adapter for licensed products that grants access based on active periods.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/enrollments/licensed';
```

## Features

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
  createProduct(product: {
    type: PLAN_PRODUCT
  }) {
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
      trialIntervalCount: 0
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

## Activation Logic

The adapter activates only for products with `usageCalculationType: LICENSED`:

```typescript
isActivatedFor: (productPlan) => {
  return productPlan?.usageCalculationType === 'LICENSED';
}
```

## Validity Check

Access is granted when the current date falls within any enrollment period:

```typescript
isValidForActivation: async () => {
  const periods = enrollment?.periods || [];
  const now = new Date();

  return periods.some(period => {
    const start = new Date(period.start);
    const end = new Date(period.end);
    return start <= now && end >= now;
  });
}
```

## Order Generation

Orders are generated at the beginning of each period:

```typescript
configurationForOrder: async ({ period }) => {
  const beginningOfPeriod = period.start.getTime() <= Date.now();

  if (beginningOfPeriod) {
    return {
      period,
      orderContext: {},
      orderPositionTemplates: [{
        quantity: 1,
        productId: enrollment.productId,
        originalProductId: enrollment.productId,
      }],
    };
  }
  return null;
}
```

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

Use the [Enrollment Order Generator Worker](../workers/worker-enrollment-order-generator.md) to automatically generate orders:

```typescript
import { configureGenerateOrderAutoscheduling } from '@unchainedshop/plugins/worker/enrollment-order-generator';
import { enrollmentsSettings } from '@unchainedshop/core-enrollments';
import { schedule } from '@unchainedshop/core';

// Run daily at midnight
enrollmentsSettings.autoSchedulingSchedule = schedule.parse.cron('0 0 * * *');
configureGenerateOrderAutoscheduling();
```

## Extending the Adapter

For custom subscription logic, use `registerEnrollment`:

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

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.enrollments.licensed` |
| Version | `1.0.0` |
| Source | [enrollments/licensed.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/enrollments/licensed.ts) |

## Related

- [Plugins Overview](./) - All available plugins
- [Enrollment Order Generator](../workers/worker-enrollment-order-generator.md) - Auto-generate orders
