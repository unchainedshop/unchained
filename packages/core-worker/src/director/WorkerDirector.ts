import { WorkData, IWorkerAdapter, WorkResult } from '../worker-index.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import { Work } from '../types.js';

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

export interface WorkerSchedule {
  schedules: Array<Record<string, any>>;
  exceptions: Array<Record<string, any>>;
}

export type WorkScheduleConfiguration = Pick<
  WorkData,
  'timeout' | 'retries' | 'priority' | 'worker' | 'scheduleId'
> & {
  type: string;
  input?: (workData: Omit<WorkData, 'input'>) => Promise<Record<string, any> | null>;
  schedule: WorkerSchedule;
  scheduleId?: string;
};

export type IWorkerDirector = IBaseDirector<IWorkerAdapter<any, any>> & {
  getActivePluginTypes: (options?: { external?: boolean }) => Array<string>;
  getAdapterByType: (type: string) => IWorkerAdapter<any, any>;
  disableAutoscheduling: (scheduleId: string) => void;
  configureAutoscheduling: (workScheduleConfiguration: WorkScheduleConfiguration) => void;
  getAutoSchedules: () => Array<[string, WorkScheduleConfiguration]>;
  doWork: (work: Work, unchainedAPI) => Promise<WorkResult<any>>;
};

const AutoScheduleMap = new Map<string, WorkScheduleConfiguration>();

const baseDirector = BaseDirector<IWorkerAdapter<any, any>>('WorkerDirector', {
  adapterKeyField: 'key',
});

export const WorkerDirector: IWorkerDirector = {
  ...baseDirector,

  getActivePluginTypes: ({ external } = { external: null }) => {
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
      `WorkerDirector -> Configured ${adapter.type} ${adapter.key}@${adapter.version} (${adapter.label}) for Autorun at ${JSON.stringify(workItemConfiguration.schedule?.schedules)}`,
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
