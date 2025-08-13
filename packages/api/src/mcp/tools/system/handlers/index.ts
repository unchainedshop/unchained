import activeWorkTypes from './activeWorkTypes.js';
import addWork from './addWork.js';
import allocateWork from './allocateWork.js';
import countEvents from './countEvents.js';
import countWork from './countWork.js';
import finishWork from './finishWork.js';
import getEvent from './getEvent.js';
import getEventsStatistics from './getEventsStatistics.js';
import getShopInfo from './getShopInfo.js';
import getWork from './getWork.js';
import getWorkStatistics from './getWorkStatistics.js';
import listEvents from './listEvents.js';
import listWork from './listWork.js';
import processNextWork from './processNextWork.js';
import removeWork from './removeWork.js';

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
