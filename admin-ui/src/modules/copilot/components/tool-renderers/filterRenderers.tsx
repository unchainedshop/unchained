import { renderTexts } from './textRenderers';
import CopilotFilterList, {
  CopilotFilterItem,
} from '../product/CopilotFilterList';
import OperationStatusIndicator from '../OperationStatusIndicator';
import {
  createRenderer,
  createActionMappings,
  mergeMappings,
} from './shared/createRenderer';
import copilotCount from '../copilotCount';

const FILTER_ITEM_ACTIONS = [
  'GET',
  'CREATE',
  'UPDATE',
  'REMOVE_OPTION',
  'CREATE_OPTION',
];
const TEXT_ACTIONS = ['GET_TEXTS', 'UPDATE_TEXTS'];

const toolsMap = mergeMappings(
  {
    LIST: CopilotFilterList,
    REMOVE: OperationStatusIndicator,
    COUNT: copilotCount('FILTER'),
  },
  createActionMappings(FILTER_ITEM_ACTIONS, CopilotFilterItem),
  Object.fromEntries(
    TEXT_ACTIONS.map((action) => [action, renderTexts(action)]),
  ),
);

const filterRenderers = createRenderer({
  toolsMap,
  fallbackComponent: ({ action, data }) =>
    JSON.stringify({ action, data }, null, 2),
});
export default filterRenderers;
