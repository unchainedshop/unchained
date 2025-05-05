import { IWorkerAdapter, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';

const wait = async (time: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

interface Arg {
  wait?: number;
  fails?: boolean;
}

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
