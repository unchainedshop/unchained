import {
  IWorkerDirector,
  IWorkerAdapter,
  Work,
  WorkScheduleConfigureation,
} from '@unchainedshop/types/worker';
import { EventEmitter } from 'events';
import { BaseDirector } from 'meteor/unchained:utils';
import { log, LogLevel } from 'meteor/unchained:logger';
import { WorkerEventTypes } from './WorkerEventTypes';
import { Context } from '@unchainedshop/types/api';

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const AutoScheduleMap = new Map<string, WorkScheduleConfigureation>();
const Events = new EventEmitter();

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
        `WorkderDirector: There is already a adapter registered with type: ${Adapter.type}`
      );

    baseDirector.registerAdapter(Adapter);
  },

  configureAutoscheduling: (adapter, workQueue) => {
    const { schedule } = workQueue;
    AutoScheduleMap.set(adapter.type, workQueue);
    log(
      `WorkderDirector -> Configured ${adapter.type} ${adapter.key}@${adapter.version} (${adapter.label}) for Autorun at ${schedule}`
    );
  },
  getAutoSchedules: () => Array.from(AutoScheduleMap),

  doWork: async ({ type, input }, requestContext: Context) => {
    const adapter = baseDirector.getAdapter(type);

    if (!adapter) {
      log(`WorkderDirector: No registered adapter for type: ${type}`);
    }

    const output = await adapter
      .doWork(input, requestContext)
      .catch((error) => {
        // DO not use this as flow control. The adapter should catch expected errors and return status: FAILED
        log('DO not use this as flow control.', { level: LogLevel.Verbose });

        log(`WorkderDirector -> Error doing work ${type}: ${error.message}`);

        const output = { error, success: false };

        WorkerDirector.events.emit(WorkerEventTypes.DONE, { output });

        return output;
      });

    WorkerDirector.events.emit(WorkerEventTypes.DONE, { output });

    return output;
  },
};
