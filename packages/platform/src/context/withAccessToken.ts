import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api.js';

const logger = createLogger('unchained:platform');

const contextIdentity = (params) => params;

export default (fn: (context: Context) => any = contextIdentity): any => {
  return async (params, unchainedContextFn) => {
    const unchainedContext = await unchainedContextFn(params);
    const newContext = {
      userId: unchainedContext.userId,
      user: unchainedContext.user,
    };
    if (!unchainedContext.userId && params.req.headers.authorization) {
      const [type, userToken] = params.req.headers.authorization.split(' ');
      if (type === 'Bearer' && userToken) {
        const [username, secret] = userToken.split(':');
        const user = await unchainedContext.modules.users.findUserByUsername(username);
        if (secret && user?.services.token?.secret === secret) {
          newContext.userId = user._id;
          newContext.user = user;
        } else {
          logger.warn('Token login failed');
        }
      }
    }
    return fn({
      ...unchainedContext,
      ...newContext,
    });
  };
};
