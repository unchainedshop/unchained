import {
  IWorkerAdapter,
  IWorkerDirector,
  WorkScheduleConfiguration,
} from '@unchainedshop/types/worker.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from '@unchainedshop/utils';

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
    const config = AutoScheduleMap.get(type);
    AutoScheduleMap.set(type, { ...config, schedule: null });
  },

  unregisterAdapter: (key) => {
    const adapter = WorkerDirector.getAdapter(key);
    const result = baseDirector.unregisterAdapter(key);
    if (adapter) {
      AutoScheduleMap.forEach((workItemConfiguration, scheduleId) => {
        if (workItemConfiguration.type === adapter.type) {
          AutoScheduleMap.delete(scheduleId);
        }
      });
    }
    return result;
  },

  configureAutoscheduling: (workItemConfiguration) => {
    const adapter = WorkerDirector.getAdapterByType(workItemConfiguration.type);
    AutoScheduleMap.set(
      workItemConfiguration.scheduleId || workItemConfiguration.type,
      workItemConfiguration,
    );
    log(
      `WorkerDirector -> Configured ${adapter.type} ${adapter.key}@${adapter.version} (${adapter.label}) for Autorun at ${workItemConfiguration.schedule}`,
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
