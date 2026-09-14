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

const enrollmentsModule = await configureEnrollmentsModule({ db, migrationRepository });

// Create an enrollment
const enrollment = await enrollmentsModule.create({
  userId: 'user-123',
  productId: 'plan-product-456',
  quantity: 1,
  countryCode: 'CH',
  currencyCode: 'CHF',
  configuration: [],
  billingAddress: {},
  contact: {},
  delivery: {},
});

// Read the newly created enrollment
const savedEnrollment = await enrollmentsModule.findEnrollment({ enrollmentId: enrollment._id });

// Find active enrollments
const enrollments = await enrollmentsModule.findEnrollments({
  status: [EnrollmentStatus.ACTIVE],
});
```

Activation and termination workflows are available through `services.enrollments` in [`@unchainedshop/core`](../core/README.md).

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

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new enrollment |
| `updatePlan` | Update the product, quantity, and configuration |
| `updateContext` | Update enrollment metadata |
| `delete` | Delete an enrollment |
| `updateStatus` | Update enrollment status |

### Period Management

| Method | Description |
|--------|-------------|
| `addEnrollmentPeriod` | Add a billing period |
| `removeEnrollmentPeriodByOrderId` | Remove periods associated with an order |
| `isExpired` | Check if enrollment is expired |

### Utilities

| Export | Description |
|--------|-------------|
| `addToDate` | Add time interval to date |

### Constants

| Export | Description |
|--------|-------------|
| `EnrollmentStatus` | Status values (INITIAL, ACTIVE, PAUSED, TERMINATED) |

### Settings

| Export | Description |
|--------|-------------|
| `enrollmentsSettings` | Access enrollment module settings |

### Types

| Export | Description |
|--------|-------------|
| `Enrollment` | Enrollment document type |
| `EnrollmentPeriod` | Period document type |
| `EnrollmentsModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `ENROLLMENT_CREATE` | Enrollment created |
| `ENROLLMENT_UPDATE` | Enrollment updated |
| `ENROLLMENT_REMOVE` | Enrollment deleted |
| `ENROLLMENT_ADD_PERIOD` | Billing period added |

## License

EUPL-1.2
