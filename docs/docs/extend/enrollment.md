---
sidebar_position: 10
sidebar_label: Enrollments
title: Enrollments
description: Customizing subscription and enrollment handling
---

# Enrollment Adapters

Enrollment adapters handle subscription-based products and recurring billing. They control how subscriptions are created, when orders are generated, and whether access should be granted.

## EnrollmentAdapter

For every subscription product (PLAN_PRODUCT), an enrollment adapter processes the subscription lifecycle. To handle subscriptions, create an enrollment adapter that implements the `IEnrollmentAdapter` interface and register it with the EnrollmentDirector.

Multiple enrollment adapters can be registered. The first adapter where `isActivatedFor` returns `true` for the product's plan configuration will be used.

## Adapter Interface

```typescript
import {
  EnrollmentDirector,
  EnrollmentAdapter,
  type IEnrollmentAdapter
} from '@unchainedshop/core';

const CustomEnrollmentAdapter: IEnrollmentAdapter = {
  ...EnrollmentAdapter,

  key: 'my-shop.enrollments.custom',
  version: '1.0.0',
  label: 'Custom Subscription Handler',

  isActivatedFor: (productPlan) => {
    // Activate for specific usage calculation types
    return productPlan?.usageCalculationType === 'METERED';
  },

  transformOrderItemToEnrollmentPlan: async (orderPosition, unchainedAPI) => {
    // Transform order item into enrollment configuration
    return {
      configuration: orderPosition.configuration,
      productId: orderPosition.productId,
      quantity: orderPosition.quantity,
    };
  },

  actions: (params) => {
    const { enrollment, product } = params;

    return {
      ...EnrollmentAdapter.actions(params),

      isValidForActivation: async () => {
        // Check if the subscription should grant access
        const periods = enrollment?.periods || [];
        const now = Date.now();

        return periods.some(period => {
          const start = new Date(period.start).getTime();
          const end = new Date(period.end).getTime();
          return start <= now && end >= now;
        });
      },

      isOverdue: async () => {
        // Check if payment is overdue
        return false;
      },

      nextPeriod: async () => {
        // Calculate the next billing period
        // Returns null if no more periods should be created
        const plan = product?.plan;
        if (!plan) return null;

        const lastPeriod = enrollment?.periods?.[enrollment.periods.length - 1];
        const startDate = lastPeriod
          ? new Date(lastPeriod.end)
          : new Date();

        return {
          start: startDate,
          end: addDays(startDate, 30), // 30-day period
          isTrial: false,
        };
      },

      configurationForOrder: async ({ period }) => {
        // Generate order configuration for a billing period
        // Return null to skip order generation

        if (!enrollment) throw new Error('Enrollment missing');

        const beginningOfPeriod = period.start.getTime() <= Date.now();
        if (!beginningOfPeriod) return null;

        return {
          period,
          orderContext: {
            // Additional context passed to the order
          },
          orderPositionTemplates: [{
            quantity: enrollment.quantity || 1,
            productId: enrollment.productId,
            originalProductId: enrollment.productId,
            configuration: enrollment.configuration,
          }],
        };
      },
    };
  },
};
```

## Method Reference

### Static Methods

- **isActivatedFor(productPlan)**: Determines if this adapter handles a specific product plan. Check `usageCalculationType` or other plan properties.

- **transformOrderItemToEnrollmentPlan(orderPosition, unchainedAPI)**: Transforms an order item into enrollment data when a subscription is first created from a purchase.

### Action Methods

- **isValidForActivation()**: Returns `true` if the subscription should currently grant access. Typically checks if the current date falls within an active period.

- **isOverdue()**: Returns `true` if payment is overdue. Used to trigger dunning workflows or suspend access.

- **nextPeriod()**: Calculates the next billing period. Returns `null` to indicate no more periods should be created (subscription ended).

- **configurationForOrder(\{ period \})**: Generates the order configuration for a billing period. Return `null` to skip order generation for this period.

## Usage Calculation Types

Product plans can have different `usageCalculationType` values:

| Type | Description |
|------|-------------|
| `LICENSED` | Period-based access (e.g., monthly subscription) |
| `METERED` | Usage-based billing (e.g., API calls, storage) |

## Example: Metered Subscription

```typescript
import {
  EnrollmentDirector,
  EnrollmentAdapter,
  type IEnrollmentAdapter
} from '@unchainedshop/core';

const MeteredEnrollmentAdapter: IEnrollmentAdapter = {
  ...EnrollmentAdapter,

  key: 'my-shop.enrollments.metered',
  version: '1.0.0',
  label: 'Metered Usage Subscription',

  isActivatedFor: (productPlan) => {
    return productPlan?.usageCalculationType === 'METERED';
  },

  actions: (params) => {
    const { enrollment, product } = params;

    return {
      ...EnrollmentAdapter.actions(params),

      isValidForActivation: async () => {
        // Always active as long as enrollment exists
        return enrollment?.status === 'ACTIVE';
      },

      configurationForOrder: async ({ period }) => {
        if (!enrollment) throw new Error('Enrollment missing');

        // Calculate usage for the period
        const usage = await calculateUsageForPeriod(
          enrollment._id,
          period.start,
          period.end
        );

        if (usage.units === 0) return null; // No usage, no order

        return {
          period,
          orderContext: {
            usageUnits: usage.units,
            usageDetails: usage.details,
          },
          orderPositionTemplates: [{
            quantity: usage.units,
            productId: enrollment.productId,
            originalProductId: enrollment.productId,
            configuration: [
              { key: 'usageUnits', value: String(usage.units) },
              { key: 'periodStart', value: period.start.toISOString() },
              { key: 'periodEnd', value: period.end.toISOString() },
            ],
          }],
        };
      },
    };
  },
};

EnrollmentDirector.registerAdapter(MeteredEnrollmentAdapter);
```

## Example: Trial with Grace Period

```typescript
import {
  EnrollmentDirector,
  EnrollmentAdapter,
  type IEnrollmentAdapter
} from '@unchainedshop/core';

const TrialEnrollmentAdapter: IEnrollmentAdapter = {
  ...EnrollmentAdapter,

  key: 'my-shop.enrollments.trial',
  version: '1.0.0',
  label: 'Trial Subscription with Grace Period',

  isActivatedFor: (productPlan) => {
    return productPlan?.usageCalculationType === 'LICENSED' &&
           productPlan?.trialIntervalCount > 0;
  },

  actions: (params) => {
    const { enrollment, product, modules } = params;
    const GRACE_PERIOD_DAYS = 7;

    return {
      ...EnrollmentAdapter.actions(params),

      isValidForActivation: async () => {
        const periods = enrollment?.periods || [];
        const now = Date.now();

        // Check if within any period (including grace period for non-trial)
        return periods.some(period => {
          const start = new Date(period.start).getTime();
          let end = new Date(period.end).getTime();

          // Add grace period for paid periods
          if (!period.isTrial) {
            end += GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
          }

          return start <= now && end >= now;
        });
      },

      isOverdue: async () => {
        const periods = enrollment?.periods || [];
        const currentPeriod = periods.find(p => !p.isTrial && p.orderId);

        if (!currentPeriod?.orderId) return false;

        const order = await modules.orders.findOrder({
          orderId: currentPeriod.orderId,
        });

        if (order?.status !== 'PENDING') return false;

        const dueDate = new Date(currentPeriod.start);
        dueDate.setDate(dueDate.getDate() + GRACE_PERIOD_DAYS);

        return Date.now() > dueDate.getTime();
      },
    };
  },
};

EnrollmentDirector.registerAdapter(TrialEnrollmentAdapter);
```

## Registering an Enrollment Adapter

```typescript
import { EnrollmentDirector } from '@unchainedshop/core';

EnrollmentDirector.registerAdapter(CustomEnrollmentAdapter);
```

## Related

- [Enrollment Plugins](../plugins/enrollments/) - Built-in enrollment adapters
- [Licensed Enrollments Plugin](../plugins/enrollments/enrollment-licensed.md) - Default implementation
- [Enrollment Order Generator Worker](../plugins/workers/worker-enrollment-order-generator.md) - Automatic order generation
