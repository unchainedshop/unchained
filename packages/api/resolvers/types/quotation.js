import { actions } from '../../roles';
// import { logs } from '../transformations/helpers/logs';

export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  // logs: logs('quotationId', actions.viewLogs),
};
