[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-worker.svg)](https://npmjs.com/package/@unchainedshop/core-worker)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-worker

Background job queue module for the Unchained Engine. Provides a work queue system for async task processing with plugin-based workers.

## Installation

```bash
npm install @unchainedshop/core-worker
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.worker`. Register worker plugins before platform startup; the base preset includes the `EMAIL` worker.

```typescript
import { WorkStatus } from '@unchainedshop/core-worker';

const { worker } = platform.unchainedAPI.modules;
const work = await worker.addWork({
  type: 'EMAIL',
  input: {
    from: 'shop@example.com',
    to: 'customer@example.com',
    subject: 'Order update',
    text: 'Your order is ready.',
  },
});
const pending = await worker.findWorkQueue({ status: [WorkStatus.NEW] });
```

`addWork` returns the work document. The platform's work loop allocates, executes, and finishes internal jobs through `WorkerDirector`. External workers claim jobs with `allocateWork` and report results with `finishWork`; allocation alone does not execute them. Higher numeric priorities are processed first.

See the [module settings](https://docs.unchained.shop/platform-configuration/modules/worker), [worker extension guide](https://docs.unchained.shop/extend/worker), [public exports](src/worker-index.ts), and [module implementation](src/module/configureWorkerModule.ts).

## License

EUPL-1.2
