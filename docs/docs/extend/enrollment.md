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

  // Notice period: terminate at the end of the current period instead of immediately
  terminationDate: async (context, { referenceDate }) => {
    const current = context.enrollment.periods.find(
      (p) => new Date(p.start) <= referenceDate && new Date(p.end) >= referenceDate,
    );
    return current ? new Date(current.end) : referenceDate;
  },

  // Allow plan changes
  transformPlanToNewPlan: async (context, { plan }) => plan,
});
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
| `terminationDate(context, { referenceDate })` | when a termination request takes effect: `referenceDate` for immediately (default), a later date for a notice period, `null` to reject it. The engine never terminates before the enrollment's `minimumCommitmentEnd` |
| `transformPlanToNewPlan(context, { plan })` | accept a plan change by returning the (optionally adjusted) plan, or reject it with `null` (default). Billed periods stay; the next period follows the new plan |

Plans expose a `usageCalculationType` of `LICENSED` (period-based access) or `METERED` (usage-based billing).

> For full control of every `IEnrollmentAdapter` method, build the adapter directly (spread `EnrollmentAdapter`) and register it via `pluginRegistry.register()` — see [Plugin System](../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Plugin Factories](./plugin-factories.md#enrollments) — `registerEnrollment`
- [Licensed Enrollments Plugin](../plugins/enrollments/enrollment-licensed.md) — the default implementation
