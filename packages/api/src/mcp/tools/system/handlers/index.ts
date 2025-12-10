import activeWorkTypes from './activeWorkTypes.ts';
import addWork from './addWork.ts';
import allocateWork from './allocateWork.ts';
import countEvents from './countEvents.ts';
import countWork from './countWork.ts';
import finishWork from './finishWork.ts';
import getEvent from './getEvent.ts';
import getEventsStatistics from './getEventsStatistics.ts';
import getShopInfo from './getShopInfo.ts';
import getWork from './getWork.ts';
import getWorkStatistics from './getWorkStatistics.ts';
import listEvents from './listEvents.ts';
import listWork from './listWork.ts';
import processNextWork from './processNextWork.ts';
import removeWork from './removeWork.ts';

export default {
  SHOP_INFO: getShopInfo,
  WORKER_ADD: addWork,
  WORKER_ACTIVE_WORK_TYPES: activeWorkTypes,
  WORKER_ALLOCATE: allocateWork,
  WORKER_REMOVE: removeWork,
  WORKER_GET: getWork,
  WORKER_LIST: listWork,
  WORKER_COUNT: countWork,
  WORKER_FINISH_WORK: finishWork,
  WORKER_PROCESS_NEXT: processNextWork,
  WORKER_STATISTICS: getWorkStatistics,
  EVENT_GET: getEvent,
  EVENT_LIST: listEvents,
  EVENT_COUNT: countEvents,
  EVENT_STATISTICS: getEventsStatistics,
};
