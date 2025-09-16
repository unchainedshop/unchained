import copilotCount from '../copilotCount';
import CopilotUserList, { CopilotUserListItem } from '../CopilotUserList';
import OperationStatusIndicator from '../OperationStatusIndicator';
import CopilotOrderList from '../order/CopilotOrderList';
import {
  createRenderer,
  createActionMappings,
  mergeMappings,
} from './shared/createRenderer';

const USER_ITEM_ACTIONS = [
  'GET',
  'UPDATE',
  'CREATE',
  'SET_TAGS',
  'SET_USERNAME',
  'ADD_EMAIL',
  'ENROLL',
  'GET_CURRENT_USER',
];
const STATUS_ACTIONS = [
  'SEND_VERIFICATION_EMAIL',
  'SEND_ENROLLMENT_EMAIL',
  'REMOVE',
  'REMOVE_PRODUCT_REVIEWS',
  'REMOVE_EMAIL',
];

const toolsMap = mergeMappings(
  {
    LIST: CopilotUserList,
    GET_ORDERS: CopilotOrderList,
    COUNT: copilotCount('USER'),
  },
  createActionMappings(USER_ITEM_ACTIONS, CopilotUserListItem),
  createActionMappings(STATUS_ACTIONS, OperationStatusIndicator),
);

const userRenderers = createRenderer({
  toolsMap,
});
export default userRenderers;
