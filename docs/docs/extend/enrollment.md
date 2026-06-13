---
sidebar_position: 10
sidebar_label: Enrollments
title: Enrollments
description: Customizing subscription and enrollment handling
---

# Enrollment Adapters

Enrollment adapters handle subscription products (`PLAN_PRODUCT`) and recurring billing — how subscriptions are created, when orders are generated, and whether access should be granted. Multiple adapters can be registered; the first whose `isActivatedFor` returns `true` for the product's plan is used.

## Creating an adapter

Use the [`registerEnrollment`](./plugin-factories.md#enrollments) factory. `configurationForOrder` is required; the rest are optional. The callbacks receive an enrollment `context` containing `enrollment` and `product`.

```typescript
import { registerEnrollment } from '@unchainedshop/core';

registerEnrollment({
  adapterId: 'custom',
  isActivatedFor: (productPlan) => productPlan?.usageCalculationType === 'METERED',

  transformOrderItem: async (orderPosition, unchainedAPI) => ({
    configuration: orderPosition.configuration,
    productId: orderPosition.productId,
    quantity: orderPosition.quantity,
  }),

  isValidForActivation: async (context) => {
    const now = Date.now();
    return (context.enrollment?.periods ?? []).some(
      (p) => new Date(p.start).getTime() <= now && new Date(p.end).getTime() >= now,
    );
  },

  nextPeriod: async (context) => {
    const last = context.enrollment?.periods?.at(-1);
    const start = last ? new Date(last.end) : new Date();
    return { start, end: addDays(start, 30), isTrial: false };
  },

  configurationForOrder: async ({ period }, context) => {
    const { enrollment } = context;
    if (!enrollment) throw new Error('Enrollment missing');
    if (period.start.getTime() > Date.now()) return null;
    return {
      orderPositionTemplates: [
        {
          quantity: enrollment.quantity ?? 1,
          productId: enrollment.productId,
          originalProductId: enrollment.productId,
          configuration: enrollment.configuration,
        },
      ],
    };
  },

  actions: (params) => {
    const { enrollment, product } = params;
    const baseActions = EnrollmentAdapter.actions(params);

    return {
      ...baseActions,

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

      nextPeriod: async ({ referenceDate } = {}) => {
        // Calculate the next billing period
        // Returns null if no more periods should be created
        const plan = product?.plan;
        if (!plan) return null;

        const lastPeriod = enrollment?.periods?.[enrollment.periods.length - 1];
        const startDate = lastPeriod
          ? new Date(lastPeriod.end)
          : (referenceDate || new Date());

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

      terminationDate: async ({ referenceDate }) => {
        // Return the date when termination should take effect
        // Return a future date to schedule termination (notice period)
        // Return referenceDate for immediate termination
        // Return null to reject termination entirely
        return referenceDate;
      },

      expiryDate: async () => {
        // Return a fixed expiry date for the enrollment, or null for no expiry
        return null;
      },

      initialPeriods: async ({ referenceDate }) => {
        // Return the initial periods to create when the enrollment is set up
        // Defaults to delegating to nextPeriod()
        const period = await baseActions.nextPeriod({ referenceDate });
        return period ? [period] : [];
      },

      transformPlanToNewPlan: async ({ plan, referenceDate }) => {
        // Handle plan change requests on active enrollments
        // Return null to reject the plan change
        // Return { plan, effectiveDate } to accept it
        return {
          plan,
          effectiveDate: referenceDate,
        };
      },
    };
  },
};
```

## Callback reference

| Option | Description |
|---|---|
| `isActivatedFor(productPlan)` | does this adapter handle the given plan? (check `usageCalculationType`) |
| `transformOrderItem(orderPosition, api)` | turn the purchased item into enrollment data when the subscription is created |
| `configurationForOrder({ period }, context)` | **required** — generate the order for a billing period; return `null` to skip |
| `nextPeriod(context)` | the next billing window; `null` ends the subscription |
| `isValidForActivation(context)` | should the subscription currently grant access? |
| `isOverdue(context)` | is payment overdue? (drives dunning/suspension) |

Plans expose a `usageCalculationType` of `LICENSED` (period-based access) or `METERED` (usage-based billing).

- **transformOrderItemToEnrollmentPlan(orderPosition, unchainedAPI)**: Transforms an order item into enrollment data when a subscription is first created from a purchase.

### Action Methods

- **isValidForActivation()**: Returns `true` if the subscription should currently grant access. Typically checks if the current date falls within an active period.

- **isOverdue()**: Returns `true` if payment is overdue. Used to trigger dunning workflows or pause the enrollment.

- **nextPeriod(\{ referenceDate? \})**: Calculates the next billing period. Accepts an optional `referenceDate` (defaults to now). Returns `null` to indicate no more periods should be created (subscription ended).

- **configurationForOrder(\{ period \})**: Generates the order configuration for a billing period. Return `null` to skip order generation for this period.

- **terminationDate(\{ referenceDate \})**: Returns the date when termination should take effect. Return `referenceDate` for immediate termination, a future date to schedule termination with a notice period, or `null` to reject the termination request entirely.

- **expiryDate()**: Returns a fixed expiry date for the enrollment, or `null` for no automatic expiry. When set, the enrollment will be terminated automatically when processed after this date.

- **initialPeriods(\{ referenceDate \})**: Returns an array of periods to create when the enrollment is first initialized. By default delegates to `nextPeriod()`. Override to create multiple initial periods (e.g., a trial period followed by a billing period).

- **transformPlanToNewPlan(\{ plan, referenceDate \})**: Handles plan change requests on active enrollments. Return `null` to reject the change, or `{ plan, effectiveDate }` to accept it. Future periods without linked orders are removed and new periods are generated starting from `effectiveDate`.

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

- [Plugin Factories](./plugin-factories.md#enrollments) — `registerEnrollment`
- [Licensed Enrollments Plugin](../plugins/enrollments/enrollment-licensed.md) — the default implementation
