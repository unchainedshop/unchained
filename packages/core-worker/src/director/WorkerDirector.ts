import { Context } from '@unchainedshop/types/api';
import { IWorkerAdapter, IWorkerDirector, WorkScheduleConfiguration } from '@unchainedshop/types/worker';
import { EventEmitter } from 'events';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from '@unchainedshop/utils';
import { WorkerEventTypes } from './WorkerEventTypes';

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const AutoScheduleMap = new Map<string, WorkScheduleConfiguration>();

const baseDirector = BaseDirector<IWorkerAdapter<any, any>>('WorkerDirector', {
  adapterKeyField: 'type',
});

export const WorkerDirector: IWorkerDirector = {
  ...baseDirector,

  events: new EventEmitter(),

  getActivePluginTypes: () => {
    return baseDirector.getAdapters().map((adapter) => adapter.type);
  },

  registerAdapter: (Adapter) => {
    if (baseDirector.getAdapter(Adapter.type))
      throw new Error(
        `WorkderDirector: There is already a adapter registered with type: ${Adapter.type}`,
      );

    baseDirector.registerAdapter(Adapter);
  },

  configureAutoscheduling: (adapter, workQueue) => {
    const { schedule } = workQueue;
    AutoScheduleMap.set(adapter.type, workQueue);
    log(
      `WorkderDirector -> Configured ${adapter.type} ${adapter.key}@${adapter.version} (${adapter.label}) for Autorun at ${schedule}`,
    );
  },
  getAutoSchedules: () => Array.from(AutoScheduleMap),

  doWork: async ({ type, input, _id: workId }, requestContext: Context) => {
    const adapter = baseDirector.getAdapter(type);

    if (!adapter) {
      log(`WorkderDirector: No registered adapter for type: ${type}`);
    }

    const output = await adapter.doWork(input, requestContext, workId).catch((error) => {
      // DO not use this as flow control. The adapter should catch expected errors and return status: FAILED
      log('DO not use this as flow control.', { level: LogLevel.Verbose });

      log(`WorkderDirector -> Error doing work ${type}: ${error.message}`);

      const errorOutput = { error, success: false };

      WorkerDirector.events.emit(WorkerEventTypes.DONE, {
        output: errorOutput,
      });

      return errorOutput;
    });

    WorkerDirector.events.emit(WorkerEventTypes.DONE, { output });

    return output;
  },
};
