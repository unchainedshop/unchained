import { DateFilterInput, SortOption } from '@unchainedshop/utils';
import { Context } from '../../context.js';
import { WorkStatus } from '@unchainedshop/core-worker';
import { WorkerDirector } from '@unchainedshop/core';

export interface WorkListOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  status?: WorkStatus[];
  types?: string[];
  sort?: SortOption[];
  created?: {
    start?: Date;
    end?: Date;
  };
}

export interface WorkCountOptions {
  queryString?: string;
  status?: WorkStatus[];
  created?: {
    start?: Date;
    end?: Date;
  };
  types?: string[];
}

export interface EventListOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  types?: string[];
  sort?: SortOption[];
  created?: Date;
}

export interface EventCountOptions {
  queryString?: string;
  created?: Date;
  types?: string[];
}

export const configureSystemMcpModule = (context: Context) => {
  const { modules, version, loaders, locale, countryCode } = context;

  return {
    system: {
      getShopInfo: async () => {
        const language = await loaders.languageLoader.load({ isoCode: locale.language });
        const country = await loaders.countryLoader.load({ isoCode: countryCode });
        const defaultLanguageIsoCode = language?.isoCode
          ? `${language.isoCode}${country?.isoCode ? '-' + country.isoCode : ''}`
          : null;

        return {
          version,
          defaultLanguageIsoCode,
          country,
          language,
          countryCode,
          locale,
        };
      },
    },

    worker: {
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

      allocate: async (options: { types?: string[]; worker?: string }) => {
        return modules.worker.allocateWork({
          types: options.types || [],
          worker: options.worker || '',
        });
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
        const countOptions = options || {};
        return modules.worker.count({
          ...countOptions,
          status: countOptions?.status || [],
        });
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
    },

    events: {
      get: async ({ eventId }: { eventId: string }) => {
        return modules.events.findEvent({ eventId });
      },

      list: async (options?: EventListOptions) => {
        const { limit = 10, offset = 0, queryString, sort, types, created } = options || {};

        return modules.events.findEvents({
          types,
          created,
          queryString,
          limit,
          offset,
          sort,
        });
      },

      count: async (options?: EventCountOptions) => {
        return modules.events.count(options || {});
      },

      getStatistics: async (options: { types?: string[]; dateRange?: DateFilterInput }) => {
        const statistics = await modules.events.getReport(options);
        return statistics;
      },
    },
  };
};

export type SystemMcpModule = ReturnType<typeof configureSystemMcpModule>;
