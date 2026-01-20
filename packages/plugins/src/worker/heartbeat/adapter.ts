import { type IWorkerAdapter, WorkerAdapter } from '@unchainedshop/core';
import { setTimeout } from 'node:timers/promises';

interface Arg {
  wait?: number;
  fails?: boolean;
}

type Result = Arg;

export const Heartbeat: IWorkerAdapter<Arg, Result> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.heartbeat',
  label: 'Heartbeat plugin to check if workers are working',
  version: '1.0.0',
  type: 'HEARTBEAT',
  maxParallelAllocations: 1,

  doWork: async (input: Arg): Promise<{ success: boolean; result: Result }> => {
    if (input?.wait) {
      await setTimeout(input.wait);
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

export default Heartbeat;
