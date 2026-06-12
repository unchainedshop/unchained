# Unchained Enrollment/Subscription Enhancements — Full Implementation Plan

## 1. Overview

This plan covers five enrollment enhancement features plus bug fixes, spanning the full stack: database schema, core module, adapter interface, services, GraphQL API, worker, reference plugin, admin UI, and tests.

### Issues addressed

| # | Summary | Plan label |
|---|---------|------------|
| 1a | Adapter-driven termination terms (min contract duration, notice periods) | Feature 1 |
| 1b | Auto-terminate at fixed point (no auto-renewal) | Feature 2 |
| 1c | Initial multi-period pre-generation (back-dated/future, boundary snapping) | Feature 3 |
| 2 | Manual admin suspend/resume API | Feature 4 |
| 3 | Plan change on running subscriptions (monthly to yearly etc.) | Feature 5 |
| 4 | Google Play Billing compatibility | Verified compatible — no enrollment changes needed beyond what is already planned |

### Google Play Billing compatibility note

The existing Apple IAP plugin (`packages/plugins/src/payment/apple-iap/`) already syncs external subscription state via `removeEnrollmentPeriodByOrderId` + `addEnrollmentPeriod` (see `fix-periods.ts`). A future Google Play plugin would follow the same pattern. The new adapter actions (`initialPeriods`, `expiryDate`, `terminationDate`) and the new `SUSPENDED` status (maps to Google Play's "paused" subscription state) make the enrollment system more compatible with externally-managed subscriptions, not less. No special changes are needed for Google Play beyond what this plan already delivers.

---

## 2. Current Architecture

### File map

```
packages/core-enrollments/src/
  db/EnrollmentsCollection.ts          # Enrollment type, EnrollmentStatus enum, EnrollmentPeriod, EnrollmentPlan
  module/configureEnrollmentsModule.ts  # Module factory: queries, mutations, updateStatus, isExpired
  enrollments-settings.ts              # Settings: autoSchedulingSchedule, enrollmentNumberHashFn
  enrollments-index.ts                 # Package exports
  addToDate.ts                         # Date math utility

packages/core/src/
  directors/
    EnrollmentAdapter.ts             # Base adapter: actions (nextPeriod, isOverdue, isValidForActivation, configurationForOrder)
    EnrollmentDirector.ts            # Director: adapter selection, transformOrderItemToEnrollment, actions()
  services/
    processEnrollment.ts             # Status machine: findNextStatus then updateStatus
    initializeEnrollment.ts          # First period setup + processEnrollment + message
    activateEnrollment.ts            # Manual activation to ACTIVE
    terminateEnrollment.ts           # Manual termination to TERMINATED
    createEnrollmentFromCheckout.ts  # Checkout creates enrollment(s) from plan products
    generateOrderFromEnrollment.ts   # Creates order from enrollment for recurring billing
    index.ts                         # Service registry + Proxy binding

packages/api/src/
  errors.ts                            # EnrollmentNotFoundError, EnrollmentWrongStatusError
  schema/
    types/enrollment.ts              # GraphQL Enrollment type, EnrollmentStatus enum
    mutation.ts                      # createEnrollment, updateEnrollment, activateEnrollment, terminateEnrollment
    query.ts                         # enrollment, enrollments, enrollmentsCount
  resolvers/
    mutations/enrollments/
      createEnrollment.ts
      updateEnrollment.ts          # Throws on plan change for non-INITIAL (line 64-69)
      activateEnrollment.ts
      terminateEnrollment.ts
    queries/enrollments/
      enrollment.ts
      enrollments.ts
      enrollmentsCount.ts
    type/enrollment/
      enrollment-types.ts          # Enrollment field resolvers
      enrollment-plan-tyes.ts
      enrollment-period-types.ts
      enrollment-payment-types.ts
      enrollment-delivery-types.ts
  roles/
    index.ts                         # Actions: viewEnrollments, viewEnrollment, createEnrollment, updateEnrollment, viewUserEnrollments
    loggedIn.ts                      # viewEnrollment isOwnedEnrollment, updateEnrollment isOwnedEnrollment, createEnrollment true
    all.ts                           # All enrollment actions false (public denied)

packages/plugins/src/
  enrollments/licensed/
    adapter.ts                       # LicensedEnrollments: isActivatedFor(LICENSED), isValidForActivation, isOverdue, configurationForOrder
    index.ts                         # Plugin definition
  worker/enrollment-order-generator/
    adapter.ts                       # Worker: queries ACTIVE+PAUSED, calls nextPeriod, generates orders
    index.ts                         # Plugin + auto-scheduling config
  presets/
    base.ts                          # Registers LicensedEnrollmentsPlugin
    all.ts                           # Registers EnrollmentOrderGeneratorPlugin

admin-ui/src/modules/enrollment/
  components/
    EnrollmentDetail.tsx             # Main detail view: status timeline, actions (activate/terminate/email), product info, periods accordion
    EnrollmentDetailHeader.tsx       # Header: enrollment number, date, country, currency
    EnrollmentListItem.tsx           # List row: status badge (INITIAL=orange, PAUSED=yellow, TERMINATED=amber, ACTIVE=emerald)
    EnrollmentList.tsx               # Paginated list
    SubscriptionList.tsx             # Periods table: order, start, end, trial badge
  hooks/
    useEnrollment.ts                 # Single enrollment query
    useEnrollments.ts                # List query
    useUserEnrollments.ts            # User enrollments
    useActivateEnrollment.ts         # Mutation hook
    useTerminateEnrollment.ts        # Mutation hook
    useSendEnrollmentEmail.ts        # Mutation hook
  fragments/
    EnrollmentFragment.ts            # List fields (includes expires, isExpired, periods, plan, user)
    EnrollmentDetailFragment.ts      # Full detail fields (adds billingAddress, contact, payment/delivery providers)
  index.ts

tests/
  enrollment.test.js                   # 1070 lines, 21 test cases
  seeds/enrollments.js                 # ActiveEnrollment, InitialEnrollment, expiredEnrollment, TerminatedEnrollment, InitialEnrollmentWithWrongPlan
```

### Current status lifecycle

```
INITIAL --(isValidForActivation)--> ACTIVE --(isOverdue)--> PAUSED
                                      ^                       |
                                      +-(isValidForActivation)+
any state --(terminateEnrollment mutation only)--> TERMINATED
```

### Patterns to follow (from orders and quotations)

1. **Service-per-action**: Each status-changing operation has its own service file (e.g., `activateEnrollment.ts`, `terminateEnrollment.ts`)
2. **Services use `this: Modules`**: Bound via Proxy in `services/index.ts`
3. **Message on every status change**: Every service calls `addMessageService('ENROLLMENT_STATUS', { ... })`
4. **Errors via `createError`**: Defined in `packages/api/src/errors.ts`
5. **ACL via `acl(actions.xxx)(resolver)`**: In `resolvers/mutations/index.ts`
6. **Hook pattern in admin-ui**: `use{Action}Enrollment` wrapping `useMutation` with `refetchQueries: ['Enrollments', 'Enrollment']`
7. **Plugin registration**: Adapters wrapped in `IPlugin` objects, registered in preset files
8. **Events registered in module factory**: Array of event names, `registerEvents()` at top of `configureEnrollmentsModule`

---

## 3. Confirmed Defects

| ID | Issue | File:Line | Impact |
|----|-------|-----------|--------|
| D1 | `isExpired` check only reachable when status is already `TERMINATED` — dead code | `packages/core/src/services/processEnrollment.ts:27` | Time-based auto-termination never fires |
| D2 | `processEnrollment` bound to wrong service (`processOrderService`) | `packages/core/src/services/index.ts:165` | Public `services.enrollments.processEnrollment()` runs the order processor |
| D3 | Worker never calls `processEnrollment` — no periodic status re-evaluation | `packages/plugins/src/worker/enrollment-order-generator/adapter.ts` | Even with D1 fixed, no execution path for auto-termination |
| D4 | `expires` only written as side-effect of `updateStatus(TERMINATED)` — cannot set upfront | `packages/core-enrollments/src/module/configureEnrollmentsModule.ts:101` | No way to express "this subscription ends on date X" while running |
| D5 | `enrollment.periods?.pop()?.end` mutates in-memory array | `packages/core-enrollments/src/module/configureEnrollmentsModule.ts:101` | Mutated array passed to event emitter; takes positionally-last period not latest-by-date |
| D6 | Worker queries `[ACTIVE, PAUSED]` — PAUSED enrollments keep generating orders | `packages/plugins/src/worker/enrollment-order-generator/adapter.ts:21` | Intentional for overdue pause, but blocks manual suspend use case |
| D7 | `activateEnrollment` does not guard against `ACTIVE` — redundant status update + message | `packages/core/src/services/activateEnrollment.ts:8` | Harmless but wasteful; only rejects `TERMINATED` |
| D8 | Adapter `actions()` type only accepts `EnrollmentContext` but runtime passes `{ ...enrollmentContext, ...unchainedAPI }` | `packages/core/src/directors/EnrollmentAdapter.ts:37` vs `EnrollmentDirector.ts:84` | New adapter methods needing `modules` will fail type checks |
| D9 | Seed data uses `.getTime()` (numbers) for Date fields | `tests/seeds/enrollments.js` | May mask type bugs in tests |

---

## 4. Design Decisions

### 4.1 New `SUSPENDED` status vs reusing `PAUSED`

**Decision: Add `SUSPENDED` as a new status.**

Reasons:
- `processEnrollment` auto-reactivates `PAUSED` to `ACTIVE` when `isValidForActivation()` returns true — a manually paused enrollment would flip back active on the next worker cycle
- The worker queries `[ACTIVE, PAUSED]` and generates orders for both — log-sniffing to distinguish manual vs overdue would require changing every consumer
- The quotation system sets precedent: each semantic state gets its own enum value
- `deleteInactiveUserEnrollments` deletes `[null, INITIAL, TERMINATED]` — a new `SUSPENDED` will not be accidentally cleaned up
- `openEnrollmentWithProduct` queries `[ACTIVE, PAUSED]` — `SUSPENDED` correctly excluded without code changes

### 4.2 Persist `requestedTerminationDate` vs live director query

**Decision: Persist as a field on the enrollment document.**

Follows the order system pattern where immutable timestamps are set on state transitions (`ordered`, `confirmed`, `fulfilled`, `rejected`). Once termination is requested, the scheduled date is a fact of record, not a live computation. Avoids instantiating an adapter on every GraphQL query.

### 4.3 Adapter `actions()` type widening

**Decision: Widen `IEnrollmentAdapter.actions` parameter to `EnrollmentContext & { modules: Modules }`.**

The director already passes `unchainedAPI` at runtime (`EnrollmentDirector.ts:83`). The `LicensedEnrollments` adapter destructures only `{ enrollment }`, so this is backward-compatible.

### 4.4 Pro-rata credits on plan change

**Decision: Out of scope for core.** The `transformPlanToNewPlan` adapter action is the hook where a project issues credit notes, discounts, or quotations. The `ENROLLMENT_UPDATE` event (field `plan`) lets external systems react. Document this in adapter JSDoc.

---

## 5. New Status Lifecycle

```
INITIAL --(isValidForActivation)--> ACTIVE --(isOverdue)-----------> PAUSED
  |                                   |  ^                             |
  |                                   |  +---(isValidForActivation)----+
  |                                   |
  |                                   +---(suspendEnrollment)---> SUSPENDED
  |                                   |                               |
  |                                   +<----(activateEnrollment)------+
  |
  |  ACTIVE/PAUSED --(expires passed OR requestedTerminationDate passed)--> TERMINATED
  |  SUSPENDED --(expires passed)--> TERMINATED
  |
  +--any non-TERMINATED --(terminateEnrollment, immediate)--> TERMINATED
     any non-TERMINATED --(terminateEnrollment, future date)--> stays current status + requestedTerminationDate set
```

Worker behavior by status:
- **ACTIVE**: process status, then generate orders
- **PAUSED** (overdue): process status, then generate orders (so customer can pay)
- **SUSPENDED** (manual): skip entirely — no orders, no auto-reactivation
- **TERMINATED**: not queried

---

## 6. Adapter Interface Changes

### Current interface (`EnrollmentAdapterActions`)

```typescript
export interface EnrollmentAdapterActions {
  configurationForOrder: (params: { period: EnrollmentPeriod }) => Promise<{
    orderContext?: Record<string, any>;
    orderPositionTemplates: EnrollmentOrderPositionTemplate[];
  } | null>;
  isOverdue: () => Promise<boolean>;
  isValidForActivation: () => Promise<boolean>;
  nextPeriod: () => Promise<EnrollmentPeriod | null>;
}
```

### New interface (four additions, all with backward-compatible defaults)

```typescript
export interface EnrollmentAdapterActions {
  // --- existing (unchanged) ---
  configurationForOrder: (params: { period: EnrollmentPeriod }) => Promise<{
    orderContext?: Record<string, any>;
    orderPositionTemplates: EnrollmentOrderPositionTemplate[];
  } | null>;
  isOverdue: () => Promise<boolean>;
  isValidForActivation: () => Promise<boolean>;
  nextPeriod: () => Promise<EnrollmentPeriod | null>;

  // --- Feature 1: Termination terms ---
  // Returns the earliest allowed termination date given contract terms.
  // null = termination not allowed yet (e.g., minimum contract not met).
  // Default: referenceDate (immediate termination — current behavior).
  terminationDate: (params: { referenceDate: Date }) => Promise<Date | null>;

  // --- Feature 2: Fixed-point auto-termination ---
  // Returns a fixed expiry date at initialization.
  // null = auto-renew forever (current behavior).
  // Default: null.
  expiryDate: () => Promise<Date | null>;

  // --- Feature 3: Multi-period pre-generation ---
  // Returns periods to pre-generate at initialization.
  // May include back-dated periods or future periods with boundary snapping.
  // Default: [await nextPeriod()] (current single-period behavior).
  initialPeriods: (params: { referenceDate: Date }) => Promise<EnrollmentPeriod[]>;

  // --- Feature 5: Plan change validation ---
  // Validates and transforms a plan change request on a running enrollment.
  // null = plan change not supported (current behavior — typed error).
  // Default: null.
  transformPlanToNewPlan: (params: {
    plan: EnrollmentPlan;
    referenceDate: Date;
  }) => Promise<{ plan: EnrollmentPlan; effectiveDate: Date } | null>;
}
```

### Adapter `actions()` signature change

```typescript
// Before (EnrollmentAdapter.ts:37)
actions: (params: EnrollmentContext) => EnrollmentAdapterActions;

// After
actions: (params: EnrollmentContext & { modules: Modules }) => EnrollmentAdapterActions;
```

### Base adapter `nextPeriod()` expiry guard

Add to the existing default `nextPeriod()` in `EnrollmentAdapter.ts`:

```typescript
// Before returning a period, check if enrollment has an expires date
// and the period would start after it — if so, return null (no more periods)
const { enrollment } = context;
if (enrollment?.expires) {
  const expiryTime = new Date(enrollment.expires).getTime();
  if (period.start.getTime() >= expiryTime) {
    return null;
  }
}
```

---

## 7. Implementation Phases

### Phase 1 — Bug Fixes (no feature changes, no API changes)

#### 1.1 Fix D2: Wrong service binding

**File**: `packages/core/src/services/index.ts`

Line 165 currently reads:
```typescript
processEnrollment: processOrderService as Bound<typeof processOrderService>,
```

Change to:
```typescript
processEnrollment: processEnrollmentService as Bound<typeof processEnrollmentService>,
```

Add the missing import at the top of the file:
```typescript
import { processEnrollmentService } from './processEnrollment.ts';
```

#### 1.2 Fix D1: Dead expiry check

**File**: `packages/core/src/services/processEnrollment.ts`

Current `findNextStatus` logic (lines 18-28):
```typescript
if (status === INITIAL || status === PAUSED) {
  if (await director.isValidForActivation()) status = ACTIVE;
} else if (status === ACTIVE) {
  if (await director.isOverdue()) status = PAUSED;
} else if (modules.enrollments.isExpired(enrollment, {})) {
  status = TERMINATED;
}
```

Reorder to check expiry first for ACTIVE and PAUSED:
```typescript
if (modules.enrollments.isExpired(enrollment, {})) {
  status = EnrollmentStatus.TERMINATED;
} else if (status === EnrollmentStatus.INITIAL || status === EnrollmentStatus.PAUSED) {
  if (await director.isValidForActivation()) {
    status = EnrollmentStatus.ACTIVE;
  }
} else if (status === EnrollmentStatus.ACTIVE) {
  if (await director.isOverdue()) {
    status = EnrollmentStatus.PAUSED;
  }
}
```

#### 1.3 Fix D5 + preserve existing expires

**File**: `packages/core-enrollments/src/module/configureEnrollmentsModule.ts`

In `updateStatus`, the `TERMINATED` case (line 101):

Current:
```typescript
case EnrollmentStatus.TERMINATED:
  modifier.$set.expires = enrollment.periods?.pop()?.end || new Date();
  break;
```

Replace with:
```typescript
case EnrollmentStatus.TERMINATED: {
  if (!enrollment.expires) {
    const latestEnd = enrollment.periods?.reduce<Date | null>((acc, p) => {
      const end = new Date(p.end);
      return !acc || end.getTime() > acc.getTime() ? end : acc;
    }, null);
    modifier.$set.expires = latestEnd || new Date();
  }
  break;
}
```

#### 1.4 Fix D7: Guard activateEnrollment against ACTIVE

**File**: `packages/core/src/services/activateEnrollment.ts`

Current (line 8):
```typescript
if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;
```

Change to:
```typescript
if (
  enrollment.status === EnrollmentStatus.TERMINATED ||
  enrollment.status === EnrollmentStatus.ACTIVE
)
  return enrollment;
```

#### 1.5 Fix D9: Seed date types

**File**: `tests/seeds/enrollments.js`

Replace all `.getTime()` calls on date fields with plain `new Date()` objects. Example: `expires: new Date('2030/09/10').getTime()` becomes `expires: new Date('2030/09/10')`.

#### 1.6 Verify

Run `npm run test:run:integration` and `npm run test:run:unit` — all existing tests must pass.

---

### Phase 2 — Module-Level Additions (no API, no adapter changes)

#### 2.1 Schema additions

**File**: `packages/core-enrollments/src/db/EnrollmentsCollection.ts`

Add `SUSPENDED` to the enum:
```typescript
export const EnrollmentStatus = {
  INITIAL: 'INITIAL',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;
```

Add field to `Enrollment` type:
```typescript
export type Enrollment = {
  // ... existing fields ...
  expires?: Date;
  requestedTerminationDate?: Date;  // <-- add this
  // ...
};
```

#### 2.2 New module methods

**File**: `packages/core-enrollments/src/module/configureEnrollmentsModule.ts`

Add to the returned object:

```typescript
// Reuse existing pattern
updateExpiry: updateEnrollmentField<Date>('expires'),
updateRequestedTerminationDate: updateEnrollmentField<Date>('requestedTerminationDate'),

// Bulk add periods (single MongoDB operation)
addEnrollmentPeriods: async (enrollmentId: string, periods: EnrollmentPeriod[]) => {
  if (!periods.length) return null;
  const selector = generateDbFilterById(enrollmentId);
  const enrollment = await Enrollments.findOneAndUpdate(
    selector,
    {
      $push: {
        periods: {
          $each: periods.map(({ start, end, orderId, isTrial }) => ({
            start, end, orderId, isTrial,
          })),
        },
      },
      $set: { updated: new Date() },
    },
    { returnDocument: 'after' },
  );
  if (!enrollment) return null;
  await emit('ENROLLMENT_ADD_PERIOD', { enrollment });
  return enrollment;
},

// Remove future unbilled periods (for plan changes)
removeFuturePeriods: async (enrollmentId: string, afterDate: Date) => {
  const selector = generateDbFilterById(enrollmentId);
  const enrollment = await Enrollments.findOneAndUpdate(
    selector,
    {
      $pull: {
        periods: {
          start: { $gte: afterDate },
          orderId: { $in: [null, undefined] },
        },
      },
      $set: { updated: new Date() },
    },
    { returnDocument: 'after' },
  );
  if (!enrollment) return null;
  await emit('ENROLLMENT_UPDATE', { enrollment, field: 'periods' });
  return enrollment;
},
```

#### 2.3 Events

Add to `ENROLLMENT_EVENTS` array:
```typescript
const ENROLLMENT_EVENTS: string[] = [
  'ENROLLMENT_ADD_PERIOD',
  'ENROLLMENT_CREATE',
  'ENROLLMENT_REMOVE',
  'ENROLLMENT_UPDATE',
  'ENROLLMENT_SUSPEND',
  'ENROLLMENT_RESUME',
];
```

#### 2.4 updateStatus: handle SUSPENDED

In the `switch (status)` block within `updateStatus`, add:
```typescript
case EnrollmentStatus.SUSPENDED:
  break; // No special side effects
```

#### 2.5 Unit tests

Add unit tests beside `configureEnrollmentsModule.ts` for `addEnrollmentPeriods`, `removeFuturePeriods`, `updateExpiry`, `updateRequestedTerminationDate`, and the `SUSPENDED` status in `updateStatus`.

---

### Phase 3 — Adapter Interface Expansion

#### 3.1 Widen adapter actions type + add new actions

**File**: `packages/core/src/directors/EnrollmentAdapter.ts`

Update `IEnrollmentAdapter.actions` signature:
```typescript
import type { Modules } from '../modules.ts';

// Update the actions signature on the interface
actions: (params: EnrollmentContext & { modules: Modules }) => EnrollmentAdapterActions;
```

Add four new properties to `EnrollmentAdapterActions` interface (see Section 6 above for full types).

Add defaults in the base `EnrollmentAdapter.actions` implementation:
```typescript
actions: (context) => {
  const baseActions = {
    configurationForOrder: async () => {
      throw new Error('Not implemented on EnrollmentAdapter');
    },
    isOverdue: async () => false,
    isValidForActivation: async () => false,

    nextPeriod: async () => {
      // ... existing logic ...
      // ADD: expiry guard before return
      const { enrollment } = context;
      if (enrollment?.expires && period) {
        if (period.start.getTime() >= new Date(enrollment.expires).getTime()) {
          return null;
        }
      }
      return period;
    },

    terminationDate: async ({ referenceDate }: { referenceDate: Date }) => referenceDate,

    expiryDate: async () => null,

    initialPeriods: async ({ referenceDate }: { referenceDate: Date }) => {
      const period = await baseActions.nextPeriod();
      return period ? [period] : [];
    },

    transformPlanToNewPlan: async () => null,
  };
  return baseActions;
},
```

#### 3.2 Director pass-through

**File**: `packages/core/src/directors/EnrollmentDirector.ts`

The `actions()` method already passes `unchainedAPI` to the adapter at runtime (line 84). No functional change needed — just update the `EnrollmentAdapterActions` return type to include the new methods, which it inherits from the interface.

#### 3.3 Unit tests

Test base adapter defaults: `terminationDate` returns `referenceDate`, `expiryDate` returns `null`, `initialPeriods` returns `[nextPeriod()]`, `transformPlanToNewPlan` returns `null`, `nextPeriod` returns `null` when `start >= expires`.

---

### Phase 4 — Services

#### 4.1 Feature 1: Rework terminateEnrollment

**File**: `packages/core/src/services/terminateEnrollment.ts`

Replace current implementation:

```typescript
import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';
import { EnrollmentDirector } from '../core-index.ts';
import type { Modules } from '../modules.ts';

export async function terminateEnrollmentService(this: Modules, enrollment: Enrollment) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  const product = await this.products.findProduct({ productId: enrollment.productId });
  if (!product) throw new Error('Product not found for enrollment');

  const director = await EnrollmentDirector.actions({ enrollment, product }, { modules: this });
  const terminationDate = await director.terminationDate({ referenceDate: new Date() });

  // null = termination not allowed
  if (terminationDate === null) {
    throw new Error('Enrollment termination is not allowed at this time');
    // In Phase 5, this becomes EnrollmentTerminationNotAllowedError
  }

  const now = new Date();
  let updatedEnrollment: Enrollment;

  if (terminationDate.getTime() > now.getTime()) {
    // Future termination: schedule it, keep current status
    updatedEnrollment = (await this.enrollments.updateRequestedTerminationDate(
      enrollment._id,
      terminationDate,
    )) as Enrollment;

    updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
      status: enrollment.status as EnrollmentStatus,
      info: `termination scheduled for ${terminationDate.toISOString()}`,
    })) as Enrollment;
  } else {
    // Immediate termination
    updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
      status: EnrollmentStatus.TERMINATED,
      info: 'terminated manually',
    })) as Enrollment;

    updatedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);
  }

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment._id,
  });

  return updatedEnrollment;
}
```

#### 4.2 Features 2 + 3: Rework initializeEnrollment

**File**: `packages/core/src/services/initializeEnrollment.ts`

Replace current implementation:

```typescript
import type { Enrollment } from '@unchainedshop/core-enrollments';
import { EnrollmentDirector } from '../core-index.ts';
import { processEnrollmentService } from './processEnrollment.ts';
import type { Modules } from '../modules.ts';
import { addMessageService } from './addMessage.ts';

export async function initializeEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  params: { orderIdForFirstPeriod?: string; reason: string },
) {
  const product = await this.products.findProduct({ productId: enrollment.productId });
  const director = await EnrollmentDirector.actions(
    { enrollment, product: product! },
    { modules: this },
  );

  // Feature 3: Multi-period pre-generation (replaces single nextPeriod call)
  const periods = await director.initialPeriods({ referenceDate: new Date() });

  let updatedEnrollment = enrollment;

  if (periods.length > 0) {
    const [firstPeriod, ...remainingPeriods] = periods;

    // First period: attach orderIdForFirstPeriod (preserving current trial/order guard)
    if (params.orderIdForFirstPeriod || firstPeriod.isTrial) {
      updatedEnrollment = (await this.enrollments.addEnrollmentPeriod(enrollment._id, {
        ...firstPeriod,
        orderId: params.orderIdForFirstPeriod,
      })) as Enrollment;
    }

    // Remaining periods: bulk add
    if (remainingPeriods.length > 0) {
      updatedEnrollment = (await this.enrollments.addEnrollmentPeriods(
        enrollment._id,
        remainingPeriods,
      )) as Enrollment;
    }
  }

  // Feature 2: Fixed-point auto-termination
  const expiryDate = await director.expiryDate();
  if (expiryDate) {
    updatedEnrollment = (await this.enrollments.updateExpiry(
      enrollment._id,
      expiryDate,
    )) as Enrollment;
  }

  const processedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);
  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user!);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: processedEnrollment._id,
  });

  return processedEnrollment;
}
```

#### 4.3 Feature 4: New suspendEnrollment service

**New file**: `packages/core/src/services/suspendEnrollment.ts`

```typescript
import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import type { Modules } from '../modules.ts';
import { addMessageService } from './addMessage.ts';

export async function suspendEnrollmentService(this: Modules, enrollment: Enrollment) {
  if (
    enrollment.status === EnrollmentStatus.TERMINATED ||
    enrollment.status === EnrollmentStatus.INITIAL ||
    enrollment.status === EnrollmentStatus.SUSPENDED
  )
    return enrollment;

  const updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.SUSPENDED,
    info: 'suspended manually',
  })) as Enrollment;

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment._id,
  });

  return updatedEnrollment;
}
```

#### 4.4 Feature 4: Update activateEnrollment for SUSPENDED resume

**File**: `packages/core/src/services/activateEnrollment.ts`

Already allows resume from `SUSPENDED` (only rejects `TERMINATED` + `ACTIVE` after Phase 1 fix). Add info distinction:

```typescript
const info =
  enrollment.status === EnrollmentStatus.SUSPENDED
    ? 'resumed from suspension'
    : 'activated manually';

let updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
  status: EnrollmentStatus.ACTIVE,
  info,
})) as Enrollment;
```

#### 4.5 Feature 5: New updateEnrollmentPlan service

**New file**: `packages/core/src/services/updateEnrollmentPlan.ts`

```typescript
import type { Enrollment, EnrollmentPlan } from '@unchainedshop/core-enrollments';
import { EnrollmentDirector } from '../core-index.ts';
import { processEnrollmentService } from './processEnrollment.ts';
import type { Modules } from '../modules.ts';

export async function updateEnrollmentPlanService(
  this: Modules,
  enrollment: Enrollment,
  params: { plan: EnrollmentPlan },
) {
  // Resolve director for CURRENT product to validate the change
  const currentProduct = await this.products.findProduct({
    productId: enrollment.productId,
  });
  if (!currentProduct) throw new Error('Current product not found');

  const currentDirector = await EnrollmentDirector.actions(
    { enrollment, product: currentProduct },
    { modules: this },
  );

  const result = await currentDirector.transformPlanToNewPlan({
    plan: params.plan,
    referenceDate: new Date(),
  });

  if (!result) {
    throw new Error('Plan change is not supported for this enrollment');
    // In Phase 5, this becomes EnrollmentPlanChangeNotSupportedError
  }

  const { plan: newPlan, effectiveDate } = result;

  // Remove future unbilled periods from the effective date
  await this.enrollments.removeFuturePeriods(enrollment._id, effectiveDate);

  // Update the plan
  let updatedEnrollment = (await this.enrollments.updatePlan(
    enrollment._id,
    newPlan,
  )) as Enrollment;

  // Re-resolve director for the NEW product to generate new periods
  const newProduct = await this.products.findProduct({
    productId: newPlan.productId,
  });
  if (!newProduct) throw new Error('New product not found');

  const newDirector = await EnrollmentDirector.actions(
    { enrollment: updatedEnrollment, product: newProduct },
    { modules: this },
  );

  // Generate new periods from the effective date
  const newPeriods = await newDirector.initialPeriods({
    referenceDate: effectiveDate,
  });
  if (newPeriods.length > 0) {
    updatedEnrollment = (await this.enrollments.addEnrollmentPeriods(
      enrollment._id,
      newPeriods,
    )) as Enrollment;
  }

  // Re-evaluate status
  updatedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);

  return updatedEnrollment;
}
```

#### 4.6 Update processEnrollment for SUSPENDED + requestedTerminationDate

**File**: `packages/core/src/services/processEnrollment.ts`

Updated `findNextStatus`:

```typescript
const findNextStatus = async (
  enrollment: Enrollment,
  modules: Modules,
): Promise<EnrollmentStatus | null> => {
  let status = enrollment.status;

  // Check requestedTerminationDate (Feature 1: scheduled termination)
  if (
    enrollment.requestedTerminationDate &&
    new Date().getTime() >=
      new Date(enrollment.requestedTerminationDate).getTime() &&
    status !== EnrollmentStatus.TERMINATED
  ) {
    return EnrollmentStatus.TERMINATED;
  }

  // Check expiry (D1 fix: now checked for ACTIVE, PAUSED, SUSPENDED)
  if (modules.enrollments.isExpired(enrollment, {})) {
    return EnrollmentStatus.TERMINATED;
  }

  const product = await modules.products.findProduct({
    productId: enrollment.productId,
  });
  if (!product) throw new Error('Product not found for enrollment');
  const director = await EnrollmentDirector.actions(
    { enrollment, product },
    { modules },
  );

  // SUSPENDED: skip auto-reactivation entirely (Feature 4)
  if (status === EnrollmentStatus.SUSPENDED) {
    return status;
  }

  if (
    status === EnrollmentStatus.INITIAL ||
    status === EnrollmentStatus.PAUSED
  ) {
    if (await director.isValidForActivation()) {
      status = EnrollmentStatus.ACTIVE;
    }
  } else if (status === EnrollmentStatus.ACTIVE) {
    if (await director.isOverdue()) {
      status = EnrollmentStatus.PAUSED;
    }
  }

  return status;
};
```

#### 4.7 Register new services

**File**: `packages/core/src/services/index.ts`

Add imports:
```typescript
import { suspendEnrollmentService } from './suspendEnrollment.ts';
import { updateEnrollmentPlanService } from './updateEnrollmentPlan.ts';
```

Add to the `enrollments` section:
```typescript
enrollments: {
  createEnrollmentFromCheckout: createEnrollmentFromCheckoutService as Bound<
    typeof createEnrollmentFromCheckoutService
  >,
  generateOrderFromEnrollment: generateOrderFromEnrollmentService as Bound<
    typeof generateOrderFromEnrollmentService
  >,
  processEnrollment: processEnrollmentService as Bound<
    typeof processEnrollmentService
  >, // D2 fix
  initializeEnrollment: initializeEnrollmentService as Bound<
    typeof initializeEnrollmentService
  >,
  activateEnrollment: activateEnrollmentService as Bound<
    typeof activateEnrollmentService
  >,
  terminateEnrollment: terminateEnrollmentService as Bound<
    typeof terminateEnrollmentService
  >,
  suspendEnrollment: suspendEnrollmentService as Bound<
    typeof suspendEnrollmentService
  >, // NEW
  updateEnrollmentPlan: updateEnrollmentPlanService as Bound<
    typeof updateEnrollmentPlanService
  >, // NEW
},
```

Update the `Services` type accordingly.

---

### Phase 5 — GraphQL API

#### 5.1 New errors

**File**: `packages/api/src/errors.ts`

Add:
```typescript
export const EnrollmentTerminationNotAllowedError = createError(
  'EnrollmentTerminationNotAllowedError',
  'Enrollment termination is not allowed at this time',
);
export const EnrollmentPlanChangeNotSupportedError = createError(
  'EnrollmentPlanChangeNotSupportedError',
  'Plan change is not supported for this enrollment',
);
```

Then update the service files from Phase 4 to use these typed errors instead of generic `new Error()`.

#### 5.2 Schema: Enrollment type

**File**: `packages/api/src/schema/types/enrollment.ts`

Add `SUSPENDED` to enum:
```graphql
enum EnrollmentStatus {
  INITIAL
  ACTIVE
  PAUSED
  SUSPENDED
  TERMINATED
}
```

Add field to Enrollment type:
```graphql
type Enrollment {
  # ... existing fields ...
  requestedTerminationDate: DateTime
}
```

#### 5.3 Schema: Mutations

**File**: `packages/api/src/schema/mutation.ts`

Add new mutation:
```graphql
suspendEnrollment(enrollmentId: ID!): Enrollment!
```

Add optional `expires` param to `updateEnrollment`:
```graphql
updateEnrollment(
  enrollmentId: ID
  plan: EnrollmentPlanInput
  billingAddress: AddressInput
  contact: ContactInput
  payment: EnrollmentPaymentInput
  delivery: EnrollmentDeliveryInput
  meta: JSON
  expires: DateTime
): Enrollment!
```

#### 5.4 New resolver: suspendEnrollment

**New file**: `packages/api/src/resolvers/mutations/enrollments/suspendEnrollment.ts`

Follow exact pattern of `activateEnrollment.ts`:

```typescript
import { log } from '@unchainedshop/logger';
import { EnrollmentNotFoundError } from '../../../errors.ts';
import { Context } from '../../../context.ts';

export default async function suspendEnrollment(
  root: never,
  { enrollmentId }: { enrollmentId: string },
  { modules, services, userId }: Context,
) {
  log('mutation suspendEnrollment', { userId });

  const enrollment = await modules.enrollments.findEnrollment({
    enrollmentId,
  });
  if (!enrollment) throw new EnrollmentNotFoundError({ enrollmentId });

  return services.enrollments.suspendEnrollment(enrollment);
}
```

#### 5.5 Update resolver: updateEnrollment

**File**: `packages/api/src/resolvers/mutations/enrollments/updateEnrollment.ts`

Replace the plan-change block (lines 63-69):
```typescript
if (plan) {
  if (enrollment.status !== EnrollmentStatus.INITIAL) {
    // Feature 5: delegate to adapter-driven plan change service
    enrollment = await services.enrollments.updateEnrollmentPlan(enrollment, {
      plan,
    });
  } else {
    enrollment = (await modules.enrollments.updatePlan(
      enrollmentId,
      plan,
    )) as Enrollment;
    enrollment = await services.enrollments.initializeEnrollment(enrollment, {
      reason: 'updated_plan',
    });
  }
}
```

Add `expires` handling (after existing field updates):
```typescript
if (expires !== undefined) {
  enrollment = (await modules.enrollments.updateExpiry(
    enrollmentId,
    expires,
  )) as Enrollment;
}
```

Update the destructured params to include `expires`.

#### 5.6 Register mutation resolver

**File**: `packages/api/src/resolvers/mutations/index.ts`

Add import:
```typescript
import suspendEnrollment from './enrollments/suspendEnrollment.ts';
```

Add to exports (beside existing enrollment mutations):
```typescript
suspendEnrollment: acl(actions.updateEnrollment)(suspendEnrollment),
```

Uses existing `updateEnrollment` action — same permission as activate/terminate.

#### 5.7 Type resolver: requestedTerminationDate

**File**: `packages/api/src/resolvers/type/enrollment/enrollment-types.ts`

Add field resolver (direct field access):
```typescript
requestedTerminationDate(obj: Enrollment) {
  return obj.requestedTerminationDate;
},
```

---

### Phase 6 — Worker

#### 6.1 Update enrollment order generator

**File**: `packages/plugins/src/worker/enrollment-order-generator/adapter.ts`

Major changes to `doWork`:

```typescript
doWork: async (input, unchainedAPI) => {
  const { modules, services } = unchainedAPI;

  const enrollments = await modules.enrollments.findEnrollments({
    status: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED],
  });

  const errors = (
    await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
          // D3 fix: Re-evaluate status BEFORE generating orders
          const processedEnrollment =
            await services.enrollments.processEnrollment(enrollment);

          // Skip if enrollment was terminated by processEnrollment
          // (expired, requestedTerminationDate passed, etc.)
          if (
            processedEnrollment.status === EnrollmentStatus.TERMINATED
          ) {
            return null;
          }

          // Feature 4: Skip SUSPENDED (defense-in-depth)
          if (
            processedEnrollment.status === EnrollmentStatus.SUSPENDED
          ) {
            return null;
          }

          const product = await modules.products.findProduct({
            productId: processedEnrollment.productId,
          });
          const director = await EnrollmentDirector.actions(
            { enrollment: processedEnrollment, product: product! },
            unchainedAPI,
          );
          const period = await director.nextPeriod();

          if (period) {
            // Expiry guard: don't generate orders beyond expires date
            if (
              processedEnrollment.expires &&
              period.start.getTime() >=
                new Date(processedEnrollment.expires).getTime()
            ) {
              return null;
            }

            if (period.isTrial) {
              await modules.enrollments.addEnrollmentPeriod(
                processedEnrollment._id,
                { ...period },
              );
              return null;
            }

            const configuration =
              await director.configurationForOrder({ period });
            if (configuration) {
              const order =
                await services.enrollments.generateOrderFromEnrollment(
                  processedEnrollment,
                  configuration,
                );
              if (order) {
                await modules.enrollments.addEnrollmentPeriod(
                  processedEnrollment._id,
                  {
                    ...period,
                    orderId: order._id,
                  },
                );
              }
            }
          }
        } catch (e) {
          return {
            name: e.name,
            message: e.message,
            stack: e.stack,
          };
        }
        return null;
      }),
    )
  ).filter(Boolean);

  if (errors.length) {
    return {
      success: false,
      error: {
        name: 'SOME_ENROLLMENTS_COULD_NOT_PROCESS',
        message:
          'Some errors have been reported during order generation',
        logs: errors,
      },
      result: {},
    };
  }
  return {
    success: true,
    result: input,
  };
},
```

---

### Phase 7 — Reference Adapter

#### 7.1 Extend LicensedEnrollments

**File**: `packages/plugins/src/enrollments/licensed/adapter.ts`

Add demo implementations for the new adapter actions:

```typescript
actions: (params) => {
  const { enrollment } = params;
  const baseActions = EnrollmentAdapter.actions(params);
  return {
    ...baseActions,

    isValidForActivation: async () => {
      const periods = enrollment?.periods || [];
      return periods.findIndex(rangeMatcher()) !== -1;
    },

    isOverdue: async () => false,

    configurationForOrder: async (context) => {
      // ... existing implementation unchanged ...
    },

    // Feature 1: 30-day notice period for termination
    terminationDate: async ({
      referenceDate,
    }: {
      referenceDate: Date;
    }) => {
      if (!enrollment?.periods?.length) return referenceDate;
      const earliest = new Date(referenceDate);
      earliest.setDate(earliest.getDate() + 30);
      return earliest;
    },

    // Feature 5: Allow plan change, effective at current period end
    transformPlanToNewPlan: async ({ plan, referenceDate }) => {
      const latestEnd = enrollment?.periods?.reduce<Date | null>(
        (acc, p) => {
          const end = new Date(p.end);
          return !acc || end.getTime() > acc.getTime() ? end : acc;
        },
        null,
      );

      return {
        plan,
        effectiveDate: latestEnd || referenceDate,
      };
    },
  };
},
```

---

### Phase 8 — Admin UI

#### 8.1 New hook: useSuspendEnrollment

**New file**: `admin-ui/src/modules/enrollment/hooks/useSuspendEnrollment.ts`

Follow the exact pattern of `useTerminateEnrollment.ts`:

```typescript
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const SuspendEnrollmentMutation = gql`
  mutation SuspendEnrollment($enrollmentId: ID!) {
    suspendEnrollment(enrollmentId: $enrollmentId) {
      _id
    }
  }
`;

const useSuspendEnrollment = () => {
  const [suspendEnrollmentMutation] = useMutation(
    SuspendEnrollmentMutation,
  );

  const suspendEnrollment = async ({ enrollmentId }) => {
    return suspendEnrollmentMutation({
      variables: { enrollmentId },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return { suspendEnrollment };
};

export default useSuspendEnrollment;
```

#### 8.2 New hook: useUpdateEnrollmentPlan

**New file**: `admin-ui/src/modules/enrollment/hooks/useUpdateEnrollmentPlan.ts`

```typescript
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const UpdateEnrollmentPlanMutation = gql`
  mutation UpdateEnrollmentPlan(
    $enrollmentId: ID!
    $plan: EnrollmentPlanInput!
  ) {
    updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
      _id
      status
      plan {
        product {
          _id
          texts {
            _id
            title
          }
        }
        quantity
        configuration {
          key
          value
        }
      }
    }
  }
`;

const useUpdateEnrollmentPlan = () => {
  const [updateEnrollmentPlanMutation] = useMutation(
    UpdateEnrollmentPlanMutation,
  );

  const updateEnrollmentPlan = async ({ enrollmentId, plan }) => {
    return updateEnrollmentPlanMutation({
      variables: { enrollmentId, plan },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return { updateEnrollmentPlan };
};

export default useUpdateEnrollmentPlan;
```

#### 8.3 Update GraphQL fragments

**File**: `admin-ui/src/modules/enrollment/fragments/EnrollmentDetailFragment.ts`

Add `requestedTerminationDate` field to the fragment:
```graphql
fragment EnrollmentDetailFragment on Enrollment {
  _id
  country { _id isoCode }
  enrollmentNumber
  updated
  status
  created
  expires
  requestedTerminationDate
  # ... rest unchanged ...
}
```

**File**: `admin-ui/src/modules/enrollment/fragments/EnrollmentFragment.ts`

Add `requestedTerminationDate` field to the fragment:
```graphql
fragment EnrollmentFragment on Enrollment {
  _id
  # ... existing fields ...
  requestedTerminationDate
  # ...
}
```

#### 8.4 Update EnrollmentListItem: SUSPENDED badge color

**File**: `admin-ui/src/modules/enrollment/components/EnrollmentListItem.tsx`

Add `SUSPENDED` to the status color map:
```typescript
const ENROLLMENT_STATUS = {
  INITIAL: 'orange',
  PAUSED: 'yellow',
  SUSPENDED: 'blue',
  TERMINATED: 'amber',
  ACTIVE: 'emerald',
};
```

#### 8.5 Update EnrollmentDetail: Suspend/Resume actions + timeline + termination info

**File**: `admin-ui/src/modules/enrollment/components/EnrollmentDetail.tsx`

**8.5.1 Add hook imports:**
```typescript
import useSuspendEnrollment from '../hooks/useSuspendEnrollment';
```

**8.5.2 Add hook usage inside the component:**
```typescript
const { suspendEnrollment } = useSuspendEnrollment();
```

**8.5.3 Add suspend handler (pattern matches onTerminateEnrollment):**
```tsx
const onSuspendEnrollment = async () => {
  await setModal(
    <AlertMessage
      buttonText={formatMessage({
        id: 'suspend_button',
        defaultMessage: 'Suspend',
      })}
      headerText={formatMessage({
        id: 'suspend_header',
        defaultMessage: 'Suspend subscription.',
      })}
      message={formatMessage({
        id: 'suspend_confirmation',
        defaultMessage:
          'Are you sure you want to suspend this subscription? No new orders will be generated until it is resumed.',
      })}
      onOkClick={async () => {
        setModal('');
        await suspendEnrollment({ enrollmentId: enrollment?._id });
        toast.success(
          formatMessage({
            id: 'suspend_success',
            defaultMessage: 'Subscription suspended successfully.',
          }),
        );
      }}
    />,
  );
};
```

**8.5.4 Update the timeline object to include SUSPENDED:**

The `StatusProgress` component renders steps from the `timeline` object, keyed by status name. The current timeline is a linear progression: `INITIAL(1) -> ACTIVE(2) -> PAUSED(3) -> TERMINATED(4)`. Adding `SUSPENDED` as a separate step changes the progress bar.

Since `SUSPENDED` is a side-branch off `ACTIVE` (not a step in normal flow), insert it between `ACTIVE` and `PAUSED` with its own action buttons:

```typescript
const timeline = {
  INITIAL: {
    id: 1,
    content: 'created',
    visible: true,
  },
  ACTIVE: {
    id: 2,
    content: 'updated',
    visible: true,
    Component: enrollment?.status === 'ACTIVE' &&
      hasRole(IRoleAction.UpdateEnrollment) && (
        <Button
          text={formatMessage({
            id: 'suspend',
            defaultMessage: 'Suspend',
          })}
          onClick={onSuspendEnrollment}
          className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-blue-500 bg-blue-500 px-2 py-1 text-base font-medium text-white hover:bg-blue-700 focus:outline-hidden focus:ring-0"
        />
      ),
  },
  SUSPENDED: {
    id: 3,
    content: 'updated',
    visible: true,
    Component: enrollment?.status === 'SUSPENDED' &&
      hasRole(IRoleAction.UpdateEnrollment) && (
        <Button
          text={formatMessage({
            id: 'resume',
            defaultMessage: 'Resume',
          })}
          onClick={onActivateEnrollment}
          className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-slate-900 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 px-2 py-1 text-base font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-0"
        />
      ),
  },
  PAUSED: {
    id: 4,
    content: 'updated',
    visible: true,
    Component: enrollment?.status === 'PAUSED' &&
      hasRole(IRoleAction.UpdateEnrollment) && (
        <Button
          text={formatMessage({
            id: 'activate',
            defaultMessage: 'Activate',
          })}
          onClick={onActivateEnrollment}
          className="bg-white-300 relative -ml-px inline-flex items-center space-x-2 rounded-md border border-slate-900 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 px-2 py-1 text-base font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-0"
        />
      ),
  },
  TERMINATED: {
    id: 5,
    content: 'updated',
    visible: true,
    Component: enrollment?.status !== 'TERMINATED' &&
      hasRole(IRoleAction.UpdateEnrollment) && (
        <Button
          text={formatMessage({
            id: 'terminate_enrollment',
            defaultMessage: 'Terminate Enrollment',
          })}
          onClick={onTerminateEnrollment}
          className="bg-white-300 inline-flex items-center space-x-2 rounded-md border border-rose-500 bg-rose-500 px-2 py-1 text-base font-medium text-white hover:bg-rose-700 focus:border-rose-400 focus:outline-hidden focus:ring-0 focus:ring-rose-400"
        />
      ),
  },
};
```

**8.5.5 Show requestedTerminationDate info banner:**

Add below `<EnrollmentDetailHeader>` and above `<StatusProgress>`:

```tsx
{enrollment?.requestedTerminationDate &&
  enrollment?.status !== 'TERMINATED' && (
    <div className="my-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
      {formatMessage(
        {
          id: 'scheduled_termination',
          defaultMessage: 'Termination scheduled for {date}',
        },
        {
          date: formatDateTime(enrollment.requestedTerminationDate, {
            dateStyle: 'full',
            timeStyle: 'short',
          }),
        },
      )}
    </div>
  )}
```

#### 8.6 Run codegen

After backend schema changes are deployed, run in admin-ui:
```bash
npm run codegen
```

This regenerates the TypeScript types (`gql/types.ts`) which will include the new `ISuspendEnrollmentMutation`, `SUSPENDED` in `IEnrollmentStatus`, `requestedTerminationDate` on `IEnrollment`, etc.

---

### Phase 9 — Tests

#### 9.1 New seed data

**File**: `tests/seeds/enrollments.js`

Add:
```javascript
export const SuspendedEnrollment = {
  _id: 'suspendedenrollment',
  status: 'SUSPENDED',
  created: new Date(),
  expires: new Date('2030/09/10'),
  enrollmentNumber: 'RANDOM-suspended',
  userId: 'admin',
  productId: PlanProduct._id,
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: new Date('2030/09/10'),
      isTrial: false,
    },
  ],
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 1,
};

export const ScheduledTerminationEnrollment = {
  _id: 'scheduledterminationenrollment',
  status: 'ACTIVE',
  created: new Date(),
  requestedTerminationDate: new Date('2025/01/01'),
  enrollmentNumber: 'RANDOM-scheduled',
  userId: 'admin',
  productId: PlanProduct._id,
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date('2024/01/01'),
      end: new Date('2025/01/01'),
      isTrial: false,
    },
  ],
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 1,
};
```

Add both to `AllEnrollmentIds` and `seedEnrollment`.

#### 9.2 Integration test cases

**File**: `tests/enrollment.test.js`

Add new test blocks:

**Feature 4 — Suspend/Resume:**
- admin can suspend an active enrollment (call `suspendEnrollment`, assert status = `SUSPENDED`)
- suspended enrollment cannot be suspended again (returns unchanged)
- cannot suspend a terminated enrollment (returns unchanged)
- admin can resume a suspended enrollment via `activateEnrollment` (assert status = `ACTIVE`)
- anonymous user cannot suspend enrollment (expect permission error)

**Feature 1 — Termination with adapter terms:**
- termination with future date sets `requestedTerminationDate` (terminate ActiveEnrollment, with LicensedEnrollments 30-day notice: assert status still `ACTIVE`, assert `requestedTerminationDate` is approximately 30 days out)
- `requestedTerminationDate` is visible on enrollment query (query the enrollment, assert field present in response)

**Feature 5 — Plan change:**
- can change plan on active enrollment when adapter supports it (call `updateEnrollment` with new plan on ActiveEnrollment, assert plan updated and periods regenerated)
- plan change on INITIAL enrollment still works (existing behavior preserved)

**Feature 2 — Expires:**
- admin can set expires on enrollment via `updateEnrollment` (assert expires field updated)

#### 9.3 Unit tests

Add alongside source files:
- `packages/core-enrollments/src/module/` — test `addEnrollmentPeriods`, `removeFuturePeriods`, `updateExpiry`, `updateRequestedTerminationDate`
- `packages/core/src/directors/` — test base adapter defaults
- `packages/core/src/services/` — test `processEnrollment` with `SUSPENDED` status, `requestedTerminationDate`, `isExpired`

---

## 8. Dependency Graph

```
Phase 1 (bug fixes)
  +---> Phase 2 (module additions)
          +---> Phase 3 (adapter interface)
                  +---> Phase 4 (services)
                          +---> Phase 5 (GraphQL API) ---> Phase 8 (admin UI)
                          +---> Phase 6 (worker)
                                  +---> Phase 7 (reference adapter)
                                          +---> Phase 9 (tests)
```

Phases 5 and 6 can run in parallel after Phase 4.
Phase 7 can run in parallel with Phase 8.
Phase 9 runs last but unit tests can be written alongside each phase.

---

## 9. Complete File Change List

### Modified files (20)

| # | File | Phase |
|---|------|-------|
| 1 | `packages/core-enrollments/src/db/EnrollmentsCollection.ts` | 2 |
| 2 | `packages/core-enrollments/src/module/configureEnrollmentsModule.ts` | 1, 2 |
| 3 | `packages/core/src/directors/EnrollmentAdapter.ts` | 3 |
| 4 | `packages/core/src/directors/EnrollmentDirector.ts` | 3 |
| 5 | `packages/core/src/services/processEnrollment.ts` | 1, 4 |
| 6 | `packages/core/src/services/initializeEnrollment.ts` | 4 |
| 7 | `packages/core/src/services/terminateEnrollment.ts` | 4 |
| 8 | `packages/core/src/services/activateEnrollment.ts` | 1, 4 |
| 9 | `packages/core/src/services/index.ts` | 1, 4 |
| 10 | `packages/api/src/errors.ts` | 5 |
| 11 | `packages/api/src/schema/types/enrollment.ts` | 5 |
| 12 | `packages/api/src/schema/mutation.ts` | 5 |
| 13 | `packages/api/src/resolvers/mutations/index.ts` | 5 |
| 14 | `packages/api/src/resolvers/mutations/enrollments/updateEnrollment.ts` | 5 |
| 15 | `packages/api/src/resolvers/type/enrollment/enrollment-types.ts` | 5 |
| 16 | `packages/plugins/src/worker/enrollment-order-generator/adapter.ts` | 6 |
| 17 | `packages/plugins/src/enrollments/licensed/adapter.ts` | 7 |
| 18 | `tests/seeds/enrollments.js` | 1, 9 |
| 19 | `admin-ui/src/modules/enrollment/components/EnrollmentDetail.tsx` | 8 |
| 20 | `admin-ui/src/modules/enrollment/components/EnrollmentListItem.tsx` | 8 |

### Modified files — fragments (2)

| # | File | Phase |
|---|------|-------|
| 21 | `admin-ui/src/modules/enrollment/fragments/EnrollmentDetailFragment.ts` | 8 |
| 22 | `admin-ui/src/modules/enrollment/fragments/EnrollmentFragment.ts` | 8 |

### New files (4 — backend)

| # | File | Phase |
|---|------|-------|
| 1 | `packages/core/src/services/suspendEnrollment.ts` | 4 |
| 2 | `packages/core/src/services/updateEnrollmentPlan.ts` | 4 |
| 3 | `packages/api/src/resolvers/mutations/enrollments/suspendEnrollment.ts` | 5 |
| 4 | New test cases added to `tests/enrollment.test.js` | 9 |

### New files (2 — admin UI)

| # | File | Phase |
|---|------|-------|
| 5 | `admin-ui/src/modules/enrollment/hooks/useSuspendEnrollment.ts` | 8 |
| 6 | `admin-ui/src/modules/enrollment/hooks/useUpdateEnrollmentPlan.ts` | 8 |

---

## 10. Breaking Changes: None

- All four new adapter actions have defaults reproducing current behavior
- `SUSPENDED` is additive — no existing code produces it
- `requestedTerminationDate` is a new nullable field
- `terminateEnrollment` mutation signature unchanged (may now return `ACTIVE` enrollment with `requestedTerminationDate` set — document in changelog)
- Plan change on non-`INITIAL`: untyped throw becomes typed error unless adapter opts in
- `suspendEnrollment` mutation and `expires` input on `updateEnrollment` are purely additive
- Admin UI handles unknown statuses gracefully (falls back to displaying raw status text)

---

## 11. Import Conventions Reminder

Per CLAUDE.md, all relative imports **must** use `.ts` extensions:
```typescript
// Correct
import { suspendEnrollmentService } from './suspendEnrollment.ts';

// Incorrect
import { suspendEnrollmentService } from './suspendEnrollment';
```

Package imports use bare package names without extensions:
```typescript
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
```
