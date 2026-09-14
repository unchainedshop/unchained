[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-enrollments.svg)](https://npmjs.com/package/@unchainedshop/core-enrollments)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-enrollments

Enrollment (subscription) management module for the Unchained Engine. Handles recurring subscriptions, subscription periods, and automatic order generation.

## Installation

```bash
npm install @unchainedshop/core-enrollments
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.enrollments`.

```typescript
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';

const { enrollments } = platform.unchainedAPI.modules;
const activeEnrollments = await enrollments.findEnrollments({
  status: [EnrollmentStatus.ACTIVE],
  userId: 'user-123',
});
```

Status filters accept arrays. Enrollment lifecycle operations and recurring order generation are coordinated by `unchainedAPI.services.enrollments` and the registered enrollment and worker plugins. The module stores enrollments and their periods (`addEnrollmentPeriod`).

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/enrollments), [public exports](src/enrollments-index.ts), and [module implementation](src/module/configureEnrollmentsModule.ts).

## License

EUPL-1.2
