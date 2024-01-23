import {
  IWorkerAdapter,
  IWorkerDirector,
  WorkScheduleConfiguration,
} from '@unchainedshop/types/worker.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from '@unchainedshop/utils';
import { emit } from '@unchainedshop/events';
import { WorkerEventTypes } from './WorkerEventTypes.js';

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const AutoScheduleMap = new Map<string, WorkScheduleConfiguration>();

const baseDirector = BaseDirector<IWorkerAdapter<any, any>>('WorkerDirector', {
  adapterKeyField: 'key',
});

export const WorkerDirector: IWorkerDirector = {
  ...baseDirector,

  getActivePluginTypes: ({ external } = {}) => {
    return WorkerDirector.getAdapters()
      .filter((adapter) => {
        if (external === null || external === undefined) return true;
        return Boolean(adapter.external) === external;
      })
      .map((adapter) => adapter.type);
  },

  registerAdapter: (Adapter) => {
    if (WorkerDirector.getAdapterByType(Adapter.type))
      throw new Error(
        `WorkerDirector: There is already a adapter registered with type: ${Adapter.type}`,
      );

    baseDirector.registerAdapter(Adapter);
  },

  disableAutoscheduling: (type) => {
    AutoScheduleMap.delete(type);
  },

  configureAutoscheduling: (adapter, workQueue) => {
    const { schedule } = workQueue;
    AutoScheduleMap.set(adapter.type, workQueue);
    log(
      `WorkerDirector -> Configured ${adapter.type} ${adapter.key}@${adapter.version} (${adapter.label}) for Autorun at ${schedule}`,
    );
  },

  getAutoSchedules: () => Array.from(AutoScheduleMap),

  getAdapterByType: (type: string) => {
    const adapters = WorkerDirector.getAdapters({
      adapterFilter: (Adapter) => {
        return type === Adapter.type;
      },
    });
    return adapters?.[0];
  },

  doWork: async ({ type, input, _id: workId }, unchainedAPI) => {
    const adapter = WorkerDirector.getAdapterByType(type);

    if (!adapter) {
      log(`WorkerDirector: No registered adapter for type: ${type}`);
    }

    try {
      const output = await adapter.doWork(input, unchainedAPI, workId);
      return output;
    } catch (error) {
      // DO not use this as flow control. The adapter should catch expected errors and return status: FAILED
      log('DO not use this as flow control.', { level: LogLevel.Verbose });
      log(`WorkerDirector -> Error doing work ${type}: ${error.message}`);

      const errorOutput = { error, success: false };
      return errorOutput;
    }
  },
};
