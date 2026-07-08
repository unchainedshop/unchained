[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-enrollments.svg)](https://npmjs.com/package/@unchainedshop/core-enrollments)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-enrollments

Enrollment (subscription) management module for the Unchained Engine. Handles recurring subscriptions, subscription periods, and automatic order generation.

## Installation

```bash
npm install @unchainedshop/core-enrollments
```

## Usage

```typescript
import { configureEnrollmentsModule, EnrollmentStatus } from '@unchainedshop/core-enrollments';

const enrollmentsModule = await configureEnrollmentsModule({ db });

// Create an enrollment
const enrollmentId = await enrollmentsModule.create({
  userId: 'user-123',
  productId: 'plan-product-456',
  quantity: 1,
});

// Activate enrollment
await enrollmentsModule.activate(enrollmentId);

// Find active enrollments
const enrollments = await enrollmentsModule.findEnrollments({
  status: EnrollmentStatus.ACTIVE,
});
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureEnrollmentsModule` | Configure and return the enrollments module |

### Queries

| Method | Description |
|--------|-------------|
| `findEnrollment` | Find enrollment by ID |
| `findEnrollments` | Find enrollments with filtering and pagination |
| `count` | Count enrollments matching query |
| `enrollmentExists` | Check if enrollment exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new enrollment |
| `update` | Update enrollment data |
| `delete` | Delete an enrollment |
| `activate` | Activate an enrollment |
| `terminate` | Terminate an enrollment |
| `updatePlan` | Change the enrollment's product plan |
| `updateExpiry` | Set or update the enrollment's expiry date |
| `updateRequestedTerminationDate` | Set or clear a scheduled termination date |
| `updateResumeAt` | Set or clear a scheduled resume date |
| `updateContractStartDate` | Set or clear the contract start date |
| `updateMinimumCommitmentEnd` | Set or clear the minimum commitment end date |
| `updateCancellation` | Store cancellation reason and comment |

### Period Management

| Method | Description |
|--------|-------------|
| `addPeriod` | Add a single billing period |
| `addEnrollmentPeriods` | Add multiple billing periods at once |
| `removeFuturePeriods` | Remove future periods without linked orders (used during plan changes) |
| `findPeriod` | Find a specific period |
| `isExpired` | Check if enrollment is expired |

### Utilities

| Export | Description |
|--------|-------------|
| `addToDate` | Add time interval to date |

### Constants

| Export | Description |
|--------|-------------|
| `EnrollmentStatus` | Status values (INITIAL, ACTIVE, PAUSED, SUSPENDED, TERMINATED) |
| `EnrollmentTerminationReason` | Cancellation reason values (USER_REQUESTED, PAYMENT_FAILED, EXPIRED, ADMIN_ACTION, OTHER) |

### Settings

| Export | Description |
|--------|-------------|
| `enrollmentsSettings` | Access enrollment module settings |

### Types

| Export | Description |
|--------|-------------|
| `Enrollment` | Enrollment document type |
| `EnrollmentPlan` | Plan document type |
| `EnrollmentPeriod` | Period document type |
| `EnrollmentsModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `ENROLLMENT_CREATE` | Enrollment created |
| `ENROLLMENT_UPDATE` | Enrollment updated |
| `ENROLLMENT_REMOVE` | Enrollment deleted |
| `ENROLLMENT_ADD_PERIOD` | Period added to enrollment |
| `ENROLLMENT_SUSPEND` | Enrollment suspended |
| `ENROLLMENT_RESUME` | Suspended enrollment resumed |
| `ENROLLMENT_PLAN_CHANGE` | Enrollment plan changed |
| `ENROLLMENT_TRIAL_ENDING` | Trial period ending within 3 days |

## License

EUPL-1.2
