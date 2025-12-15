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
      billingInterval: MONTH
      billingIntervalCount: 1
      trialIntervalCount: 0
    }
  ) {
    _id
    plan {
      usageCalculationType
      billingInterval
    }
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
    enrollment: {
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
      product {
        texts { title }
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
    isValidForActivation
    status
  }
}
```

### Terminate Enrollment

```graphql
mutation TerminateSubscription {
  terminateEnrollment(enrollmentId: "enrollment-id") {
    _id
    status
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

For custom subscription logic:

```typescript
import { EnrollmentDirector, EnrollmentAdapter, type IEnrollmentAdapter } from '@unchainedshop/core';

const CustomEnrollmentAdapter: IEnrollmentAdapter = {
  ...EnrollmentAdapter,

  key: 'my-shop.enrollments.custom',
  version: '1.0.0',
  label: 'Custom Subscription',

  isActivatedFor: (productPlan) => {
    return productPlan?.usageCalculationType === 'METERED';
  },

  actions: (params) => {
    const { enrollment, modules } = params;

    return {
      ...EnrollmentAdapter.actions(params),

      isValidForActivation: async () => {
        // Custom validation logic
        const periods = enrollment?.periods || [];
        const hasActivePeriod = periods.some(p => {
          const now = Date.now();
          return new Date(p.start).getTime() <= now &&
                 new Date(p.end).getTime() >= now;
        });

        // Also check payment status
        const latestOrder = await modules.orders.findOrder({
          enrollmentId: enrollment._id,
          sort: { created: -1 },
        });

        return hasActivePeriod && latestOrder?.status === 'CONFIRMED';
      },

      isOverdue: async () => {
        // Check if payment is overdue
        const gracePeriodDays = 7;
        const periods = enrollment?.periods || [];
        const currentPeriod = periods.find(p => {
          const now = Date.now();
          return new Date(p.start).getTime() <= now;
        });

        if (!currentPeriod?.orderId) return false;

        const order = await modules.orders.findOrder({
          orderId: currentPeriod.orderId,
        });

        if (order?.status !== 'PENDING') return false;

        const dueDate = new Date(currentPeriod.start);
        dueDate.setDate(dueDate.getDate() + gracePeriodDays);

        return Date.now() > dueDate.getTime();
      },

      configurationForOrder: async ({ period }) => {
        // Custom order generation with usage-based pricing
        const usage = await calculateUsage(enrollment._id, period);

        return {
          period,
          orderContext: { usage },
          orderPositionTemplates: [{
            quantity: usage.units,
            productId: enrollment.productId,
            originalProductId: enrollment.productId,
            configuration: [
              { key: 'usageUnits', value: String(usage.units) },
            ],
          }],
        };
      },
    };
  },
};

EnrollmentDirector.registerAdapter(CustomEnrollmentAdapter);
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
