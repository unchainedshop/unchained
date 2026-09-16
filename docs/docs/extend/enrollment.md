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

  nextPeriod: async (context, { referenceDate } = {}) => {
    const last = context.enrollment?.periods?.at(-1);
    const start = last ? new Date(last.end) : (referenceDate ?? new Date());
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

  // Notice period: terminate at the end of the current period instead of immediately
  terminationDate: async (context, { referenceDate }) => {
    const current = context.enrollment.periods.find(
      (p) => new Date(p.start) <= referenceDate && new Date(p.end) >= referenceDate,
    );
    return current ? new Date(current.end) : referenceDate;
  },

  // Allow plan changes, effective immediately
  transformPlanToNewPlan: async (context, { plan, referenceDate }) => ({
    plan,
    effectiveDate: referenceDate,
  }),
});
```

## Callback reference

| Option | Description |
|---|---|
| `isActivatedFor(productPlan)` | does this adapter handle the given plan? (check `usageCalculationType`) |
| `transformOrderItem(orderPosition, api)` | turn the purchased item into enrollment data when the subscription is created |
| `configurationForOrder({ period }, context)` | **required** — generate the order for a billing period; return `null` to skip |
| `nextPeriod(context, { referenceDate? })` | the next billing window; `null` ends the subscription |
| `isValidForActivation(context)` | should the subscription currently grant access? |
| `isOverdue(context)` | is payment overdue? (drives dunning/suspension) |
| `terminationDate(context, { referenceDate })` | when a termination request takes effect: `referenceDate` for immediately, a later date to schedule it (notice period), `null` to reject it |
| `expiryDate(context)` | a fixed expiry date stored on the enrollment at initialization, or `null` |
| `minimumCommitmentEnd(context, { referenceDate })` | end of the minimum contract term counted from `referenceDate` (the first paid period start), or `null`; stored as `minimumCommitmentEnd` |
| `initialPeriods(context, { referenceDate })` | periods created at initialization; defaults to a single `nextPeriod` |
| `transformPlanToNewPlan(context, { plan, referenceDate })` | accept a plan change with `{ plan, effectiveDate }` or reject it with `null`; unbilled periods starting at or after `effectiveDate` are replaced by periods of the new plan |

Plans expose a `usageCalculationType` of `LICENSED` (period-based access) or `METERED` (usage-based billing).

## Usage Calculation Types

Product plans can have different `usageCalculationType` values:

| Type | Description |
|------|-------------|
| `LICENSED` | Period-based access (e.g., monthly subscription) |
| `METERED` | Usage-based billing (e.g., API calls, storage) |

## Building an adapter directly

For full control over every `IEnrollmentAdapter` method, spread `EnrollmentAdapter` and register the adapter as a plugin via `pluginRegistry.register()`.

## Example: Metered Subscription

```typescript
import {
  pluginRegistry,
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

pluginRegistry.register({
  key: MeteredEnrollmentAdapter.key,
  label: MeteredEnrollmentAdapter.label,
  version: MeteredEnrollmentAdapter.version,
  adapters: [MeteredEnrollmentAdapter],
});
```

## Example: Trial with Grace Period

```typescript
import {
  pluginRegistry,
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

pluginRegistry.register({
  key: TrialEnrollmentAdapter.key,
  label: TrialEnrollmentAdapter.label,
  version: TrialEnrollmentAdapter.version,
  adapters: [TrialEnrollmentAdapter],
});
```

## Related

- [Plugin Factories](./plugin-factories.md#enrollments) — `registerEnrollment`
- [Licensed Enrollments Plugin](../plugins/enrollments/enrollment-licensed.md) — the default implementation
