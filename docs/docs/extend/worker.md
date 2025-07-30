---
sidebar_position: 11
sidebar_label: Work Queue
title: Work Queue
---
:::info
 Add custom background workers
:::

## WorkAdapter

You can add different types of works to perform various task based on different input and triggers. Work can be a cron operation that run on a given interval to do a system backup or send an email to a user after a certain operation.

In order to make use of work to perform any task you need to implement the [IWorkAdapter](https://docs.unchained.shop/types/types/worker.IWorkerAdapter.html) interface and register it to the global WorkDirector which implements the [IWorkDirector](https://docs.unchained.shop/types/types/worker.IWorkerDirector.html).

Below is an example of work adapter that checks if all works are healthy and working correctly, runs on the  `wait` interval value passed as input


```typescript
import { IWorkerAdapter } from '@unchainedshop/core-worker';

const wait = async (time: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

type Arg = {
  wait?: number;
  fails?: boolean;
};

type Result = Arg;

const Heartbeat: IWorkerAdapter<Arg, Result> = {

  key: 'shop.unchained.worker-plugin.heartbeat',
  label: 'Heartbeat plugin to check if workers are working',
  version: '1.0.0',

  type: 'HEARTBEAT',

  doWork: async (input: Arg): Promise<{ success: boolean; result: Result }> => {
    if (input?.wait) {
      await wait(input.wait);
    }
    if (input?.fails) {
      return {
        success: false,
        result: input,
      };
    }
    return {
      success: true,
      result: input,
    };
  },
};

```
- **type**: type of the worker, this value is used to specify the worker you are targeting when adding a work to a work queue using the [WorkerModule](https://docs.unchained.shop/types/types/worker.WorkerModule.html).[addWork](https://docs.unchained.shop/types/types/worker.WorkerModule.html#__type.addWork):(data: [WorkData](https://docs.unchained.shop/types/interfaces/worker.WorkData.html), userId: string) function
- **doWork**: function that defines the actual work that is going to be performed by the work adapter

## Registering Work Adapter
Before you can add a worker in the work queue you need to register it to the global Worker director

```typescript
import { WorkerDirector } from '@unchainedshop/core-worker';

WorkerDirector.registerAdapter(Heartbeat);
```

## Adding work to the work queue

Triggering a worker is done by adding a work to the work queue using the worker module found on unchained context. below is an example that demonstrate adding the work adapter we have created above

```typescript  
unchainedAPI.modules.worker.addWork(
    {
      type: 'HEARTBEAT',
      retries: 0,
      input: {
        wait: 1000,
      },
    },
  );
}

```