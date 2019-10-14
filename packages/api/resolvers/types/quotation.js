import { actions } from '../../roles';
import { checkTypeResolver } from '../../acl';

export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  logs: checkTypeResolver(actions.viewLogs, 'logs')
};
