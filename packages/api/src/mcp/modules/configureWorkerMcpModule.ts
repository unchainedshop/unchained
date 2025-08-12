import { DateFilterInput, SortOption } from '@unchainedshop/utils';
import { Context } from '../../context.js';
import { WorkStatus } from '@unchainedshop/core-worker';
import { WorkerDirector } from '@unchainedshop/core';

export interface WorkListOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  status: WorkStatus[];
  types?: string[];
  sort?: SortOption[];
  created?: {
    start?: Date;
    end?: Date;
  };
}

export interface WorkCountOptions {
  queryString?: string;
  status: WorkStatus[];
  created?: {
    start?: Date;
    end?: Date;
  };
}

export const configureWorkerMcpModule = (context: Context) => {
  const { modules } = context;

  return {
    add: async (options: {
      type: string;
      priority?: number;
      input?: any;
      originalWorkId?: string;
      scheduled?: Date;
      retries?: number;
      worker?: string;
    }) => {
      return modules.worker.addWork(options);
    },

    activeWorkTypes: async () => {
      const typeList = await modules.worker.activeWorkTypes();
      const pluginTypes = WorkerDirector.getActivePluginTypes();
      return typeList.filter((type) => {
        return pluginTypes.includes(type);
      });
    },

    allocate: async (options: { types: string[]; worker: string }) => {
      return modules.worker.allocateWork(options);
    },

    remove: async ({ workId }: { workId: string }) => {
      return modules.worker.deleteWork(workId);
    },

    get: async ({ workId }: { workId: string }) => {
      return modules.worker.findWork({ workId });
    },

    list: async (options?: WorkListOptions) => {
      const { limit = 10, offset = 0, queryString, status, sort, types, created } = options || {};

      return modules.worker.findWorkQueue({
        status,
        types,
        created,
        queryString,
        skip: offset,
        limit,
        sort,
      });
    },

    count: async (options?: WorkCountOptions) => {
      return modules.worker.count(options);
    },

    finishWork: async (options: {
      workId: string;
      result?: any;
      error?: any;
      success: boolean;
      worker?: string;
      started?: Date;
      finished?: Date;
    }) => {
      const { workId, ...finishOptions } = options;
      return modules.worker.finishWork(workId, finishOptions);
    },

    processNext: async (options: { worker?: string }) => {
      const { worker } = options;
      const work = WorkerDirector.processNextWork(context, worker);
      return work;
    },

    getStatistics: async (options: { types?: string[]; dateRange?: DateFilterInput }) => {
      const allocationMap = await modules.worker.getReport(options);
      return {
        allocationMap,
        types: options.types || [],
        dateRange: options.dateRange || {},
      };
    },
  };
};

export type WorkerMcpModule = ReturnType<typeof configureWorkerMcpModule>;
