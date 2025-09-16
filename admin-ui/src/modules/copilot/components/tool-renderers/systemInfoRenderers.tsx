import ShopInfoCard from '../ShopInfo';
import CopilotEventList, { CopilotEventListItem } from '../CopilotEventList';
import CopilotEventStatistics from '../CopilotEventStatistics';
import CopilotWorkerList, { CopilotWorkerListItem } from '../CopilotWorkerList';
import CopilotWorkerActiveTypes from '../WorkerActiveTypesCard';
import copilotCount from '../copilotCount';
import {
  createRenderer,
  createActionMappings,
  mergeMappings,
} from './shared/createRenderer';
import CopilotWorkerStatistics from '../CopilotWorkerStatistics';

const WORKER_ACTIONS = [
  'WORKER_GET',
  'WORKER_ADD',
  'WORKER_REMOVE',
  'WORKER_ALLOCATE',
  'WORKER_PROCESS_NEXT',
  'WORKER_FINISH_WORK',
];

const toolsMap = mergeMappings(
  {
    SHOP_INFO: ShopInfoCard,
    EVENT_LIST: CopilotEventList,
    EVENT_GET: CopilotEventListItem,
    EVENT_STATISTICS: CopilotEventStatistics,
    WORKER_LIST: CopilotWorkerList,
    WORKER_ACTIVE_WORK_TYPES: CopilotWorkerActiveTypes,
    WORKER_STATISTICS: CopilotWorkerStatistics,
    EVENT_COUNT: copilotCount('EVENT'),
    WORKER_COUNT: copilotCount('WORKER'),
  },
  createActionMappings(WORKER_ACTIONS, CopilotWorkerListItem),
);

const systemInfoRenderers = createRenderer({
  toolsMap,
});
export default systemInfoRenderers;
