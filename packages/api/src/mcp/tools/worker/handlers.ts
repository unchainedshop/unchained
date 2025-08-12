import { WorkerDirector } from '@unchainedshop/core';
import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  ADD: async (workerModule, { type, priority, input, originalWorkId, scheduled, retries, worker }) => {
    const work = await workerModule.add({
      type,
      priority,
      input,
      originalWorkId,
      scheduled: scheduled ? new Date(scheduled) : undefined,
      retries,
      worker,
    });

    return { work };
  },
  ACTIVE_WORK_TYPES: async (workerModule) => {
    const typeList = await workerModule.activeWorkTypes();
    const pluginTypes = WorkerDirector.getActivePluginTypes();
    return typeList.filter((type) => {
      return pluginTypes.includes(type);
    });
  },
  ALLOCATE: async (workerModule, { types, worker }) => {
    const work = await workerModule.allocate({
      types,
      worker,
    });

    return { work };
  },

  REMOVE: async (workerModule, { workId }) => {
    const removed = await workerModule.remove({ workId });
    return { work: removed };
  },

  GET: async (workerModule, { workId }) => {
    const work = await workerModule.get({ workId });
    return { work };
  },

  LIST: async (workerModule, { limit, offset, sort, queryString, status, types, created }) => {
    const sortOptions =
      sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
      undefined;

    const works = await workerModule.list({
      limit,
      offset,
      sort: sortOptions,
      queryString,
      status,
      types,
      created,
    });

    return { works };
  },

  COUNT: async (workerModule, { queryString, status, types, created }) => {
    const count = await workerModule.count({
      queryString,
      status,
      types,
      created,
    });

    return { count };
  },

  FINISH_WORK: async (workerModule, { workId, result, error, success, worker, started, finished }) => {
    const work = await workerModule.finishWork({
      workId,
      result,
      error,
      success,
      worker,
      started,
      finished,
    });

    return { work };
  },

  PROCESS_NEXT: async (workerModule, { worker }) => {
    const work = await workerModule.processNext({
      worker,
    });

    return { work };
  },

  STATISTICS: async (workerModule, { types, dateRange }) => {
    const statistics = await workerModule.getStatistics({
      types,
      dateRange,
    });

    return { statistics };
  },
};

export default actionHandlers;
