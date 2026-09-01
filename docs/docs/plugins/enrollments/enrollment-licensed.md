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
