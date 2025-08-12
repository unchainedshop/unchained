import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  SHOP_INFO: async (systemModule) => {
    const shopInfo = await systemModule.system.getShopInfo();
    return shopInfo;
  },

  WORKER_ADD: async (
    systemModule,
    { type, priority, input, originalWorkId, scheduled, retries, worker },
  ) => {
    const work = await systemModule.worker.add({
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

  WORKER_ACTIVE_WORK_TYPES: async (systemModule) => {
    return await systemModule.worker.activeWorkTypes();
  },

  WORKER_ALLOCATE: async (systemModule, { types, worker }) => {
    const work = await systemModule.worker.allocate({
      types,
      worker,
    });

    return { work };
  },

  WORKER_REMOVE: async (systemModule, { workId }) => {
    const removed = await systemModule.worker.remove({ workId });
    return { work: removed };
  },

  WORKER_GET: async (systemModule, { workId }) => {
    const work = await systemModule.worker.get({ workId });
    return { work };
  },

  WORKER_LIST: async (systemModule, { limit, offset, sort, queryString, status, types, created }) => {
    const sortOptions =
      sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
      undefined;

    const works = await systemModule.worker.list({
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

  WORKER_COUNT: async (systemModule, { queryString, status, types, created }) => {
    const count = await systemModule.worker.count({
      queryString,
      status,
      types,
      created,
    });

    return { count };
  },

  WORKER_FINISH_WORK: async (
    systemModule,
    { workId, result, error, success, worker, started, finished },
  ) => {
    const work = await systemModule.worker.finishWork({
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

  WORKER_PROCESS_NEXT: async (systemModule, { worker }) => {
    const work = await systemModule.worker.processNext({
      worker,
    });

    return { work };
  },

  WORKER_STATISTICS: async (systemModule, { types, dateRange }) => {
    const statistics = await systemModule.worker.getStatistics({
      types,
      dateRange,
    });

    return { statistics };
  },

  EVENT_GET: async (systemModule, { eventId }) => {
    const event = await systemModule.events.get({ eventId });
    return { event };
  },

  EVENT_LIST: async (systemModule, { limit, offset, sort, queryString, types, created }) => {
    const sortOptions =
      sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
      undefined;

    const events = await systemModule.events.list({
      limit,
      offset: offset,
      sort: sortOptions,
      queryString,
      types,
      created: created ? new Date(created) : undefined,
    });

    return { events };
  },

  EVENT_COUNT: async (systemModule, { queryString, types, created }) => {
    const count = await systemModule.events.count({
      queryString,
      types,
      created: created ? new Date(created) : undefined,
    });

    return { count };
  },

  EVENT_STATISTICS: async (systemModule, { types, dateRange }) => {
    const statistics = await systemModule.events.getStatistics({
      types,
      dateRange,
    });

    return { statistics };
  },
};

export default actionHandlers;
