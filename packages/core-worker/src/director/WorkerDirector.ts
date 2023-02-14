import {
  IWorkerAdapter,
  IWorkerDirector,
  WorkScheduleConfiguration,
} from '@unchainedshop/types/worker.js';
import { EventEmitter } from 'events';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from '@unchainedshop/utils';
import { WorkerEventTypes } from './WorkerEventTypes.js';

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const AutoScheduleMap = new Map<string, WorkScheduleConfiguration>();

const baseDirector = BaseDirector<IWorkerAdapter<any, any>>('WorkerDirector', {
  adapterKeyField: 'type',
});

export const WorkerDirector: IWorkerDirector = {
  ...baseDirector,

  events: new EventEmitter(),

  getActivePluginTypes: (external) => {
    return WorkerDirector.getAdapters()
      .filter((adapter) => {
        if (external === null || external === undefined) return true;
        return Boolean(adapter.external) === external;
      })
      .map((adapter) => adapter.type);
  },

  registerAdapter: (Adapter) => {
    if (WorkerDirector.getAdapter(Adapter.type))
      throw new Error(
        `WorkerDirector: There is already a adapter registered with type: ${Adapter.type}`,
      );

    baseDirector.registerAdapter(Adapter);
  },

  configureAutoscheduling: (adapter, workQueue) => {
    const { schedule } = workQueue;
    AutoScheduleMap.set(adapter.type, workQueue);
    log(
      `WorkerDirector -> Configured ${adapter.type} ${adapter.key}@${adapter.version} (${adapter.label}) for Autorun at ${schedule}`,
    );
  },
  getAutoSchedules: () => Array.from(AutoScheduleMap),

  doWork: async ({ type, input, _id: workId }, unchainedAPI) => {
    const adapter = WorkerDirector.getAdapter(type);

    if (!adapter) {
      log(`WorkerDirector: No registered adapter for type: ${type}`);
    }

    try {
      const output = await adapter.doWork(input, unchainedAPI, workId);
      WorkerDirector.events.emit(WorkerEventTypes.DONE, { output });
      return output;
    } catch (error) {
      // DO not use this as flow control. The adapter should catch expected errors and return status: FAILED
      log('DO not use this as flow control.', { level: LogLevel.Verbose });
      log(`WorkerDirector -> Error doing work ${type}: ${error.message}`);

      const errorOutput = { error, success: false };

      WorkerDirector.events.emit(WorkerEventTypes.DONE, {
        output: errorOutput,
      });

      return errorOutput;
    }
  },
};
