import { IWorkerAdapter } from '@unchainedshop/core-worker';
import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';

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
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.heartbeat',
  label: 'Heartbeat plugin to check if workers are working',
  version: '1.0.0',
  type: 'HEARTBEAT',
  maxParallelAllocations: 1,

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

WorkerDirector.registerAdapter(Heartbeat);
