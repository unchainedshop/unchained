import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api.js';
import { timingSafeEqual } from 'crypto';

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
        const user = await unchainedContext.modules.users.findUser({
          username,
        });

        if (secret && user?.services.token?.secret) {
          if (timingSafeEqual(Buffer.from(secret), Buffer.from(user?.services.token?.secret))) {
            newContext.userId = user._id;
            newContext.user = user;
            logger.debug('Token login success');
          } else {
            logger.warn('Token login failed');
          }
        }
      }
    }
    return fn({
      ...unchainedContext,
      ...newContext,
    });
  };
};
