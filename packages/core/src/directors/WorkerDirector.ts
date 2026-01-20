import type { Work, WorkData, WorkResult } from '@unchainedshop/core-worker';
import { BaseDirector, type IBaseDirector } from '@unchainedshop/utils';
import type { ScheduleData } from '../utils/schedule.ts';
import { type IWorkerAdapter, WorkerAdapter } from './WorkerAdapter.ts';
import type { Modules } from '../modules.ts';
import { createLogger } from '@unchainedshop/logger';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

const logger = createLogger('unchained:core');

export type WorkScheduleConfiguration = Pick<
  WorkData,
  'timeout' | 'retries' | 'priority' | 'worker' | 'scheduleId'
> & {
  type: string;
  input?: (workData: Omit<WorkData, 'input'>) => Promise<Record<string, any> | null>;
  schedule?: ScheduleData;
  scheduleId?: string;
};

export type IWorkerDirector = IBaseDirector<IWorkerAdapter<any, any>> & {
  getActivePluginTypes: (options?: { external?: boolean }) => string[];
  getAdapterByType: (type: string) => IWorkerAdapter<any, any>;
  disableAutoscheduling: (scheduleId: string) => void;
  configureAutoscheduling: (workScheduleConfiguration: WorkScheduleConfiguration) => void;
  getAutoSchedules: () => [string, WorkScheduleConfiguration][];
  doWork: (work: Work, unchainedAPI) => Promise<WorkResult>;
  processNextWork: (unchainedAPI: { modules: Modules }, workerId?: string) => Promise<Work | null>;
};

const AutoScheduleMap = new Map<string, WorkScheduleConfiguration>();

const baseDirector = BaseDirector<IWorkerAdapter<any, any>>('WorkerDirector', {
  adapterKeyField: 'key',
});

export const WorkerDirector: IWorkerDirector = {
  ...baseDirector,

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(WorkerAdapter.adapterType!) as IWorkerAdapter<
      any,
      any
    >[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: ({ adapterFilter } = {}) => {
    const adapters = pluginRegistry.getAdapters(WorkerAdapter.adapterType!) as IWorkerAdapter<
      any,
      any
    >[];
    return adapters.filter(adapterFilter || (() => true));
  },

  getActivePluginTypes: ({ external } = {}) => {
    return WorkerDirector.getAdapters()
      .filter((adapter) => {
        if (external === null || external === undefined) return true;
        return Boolean(adapter.external) === external;
      })
      .map((adapter) => adapter.type);
  },

  disableAutoscheduling: (type) => {
    AutoScheduleMap.delete(type);
  },

  configureAutoscheduling: (workItemConfiguration) => {
    AutoScheduleMap.set(
      workItemConfiguration.scheduleId || workItemConfiguration.type,
      workItemConfiguration,
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
      logger.warn(`WorkerDirector: No registered adapter for type: ${type}`);
    }

    try {
      const output = await adapter.doWork(input, unchainedAPI, workId);
      return output;
    } catch (error) {
      // DO not use this as flow control. The adapter should catch expected errors and return status: FAILED
      logger.debug('DO not use this as flow control.');
      logger.error(`WorkerDirector -> Error doing work ${type}: ${error.message}`);

      const errorOutput = { error, success: false };
      return errorOutput;
    }
  },

  processNextWork: async (unchainedAPI: { modules: Modules }, workerId?: string) => {
    const adapters = WorkerDirector.getAdapters();

    const allocationMap = await unchainedAPI.modules.worker.allocationMap();

    const types = adapters
      .filter((adapter) => {
        // Filter out the external
        if (adapter.external) return false;
        if (
          adapter.maxParallelAllocations &&
          adapter.maxParallelAllocations <= allocationMap[adapter.type]
        )
          return false;
        return true;
      })
      .map((adapter) => adapter.type);

    const worker = workerId ?? unchainedAPI.modules.worker.workerId;
    const work = await unchainedAPI.modules.worker.allocateWork({
      types,
      worker,
    });

    if (work) {
      const output = await WorkerDirector.doWork(work, unchainedAPI);

      return await unchainedAPI.modules.worker.finishWork(work._id, {
        ...output,
        finished: work.finished || new Date(),
        started: work.started,
        worker,
      });
    }

    return null;
  },
};
