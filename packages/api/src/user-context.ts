import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedUserContext } from '@unchainedshop/types/api.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { emit } from '@unchainedshop/events';
import { resolveUserRemoteAddress } from '@unchainedshop/utils';
import { API_EVENTS } from './events.js';

export const getUserContext = async (
  req: IncomingMessage & { cookies?: any },
  res: OutgoingMessage, // eslint-disable-line
  unchainedAPI: UnchainedCore, // eslint-disable-line
): Promise<UnchainedUserContext> => {
  const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);
  const userAgent = req.headers['user-agent'];

  const login = async (user) => {
    await new Promise((resolve, reject) => {
      (req as any).login(user, (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });

    const tokenObject = {
      _id: (req as any).sessionID,
      /* eslint-disable-next-line */
      tokenExpires: new Date((req as any).session?.cookie._expires),
    };

    await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, { userId: user._id, ...tokenObject });

    /* eslint-disable-next-line */
    (user as any)._inLoginMethodResponse = true;
    return { user, ...tokenObject };
  };

  const logout = async (sessionId?: string) => { /* eslint-disable-line */
    // TODO: this should only logout an explicitly provided session if sessionID
    // has been provided
    // express-session destroy
    const { user } = req as any;
    if (!user) return false;

    const tokenObject = {
      _id: sessionId || (req as any).sessionID,
      userId: user._id,
    };

    await new Promise((resolve, reject) => {
      (req as any).logout((error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });

    await emit(API_EVENTS.API_LOGOUT, tokenObject);
    return true;
  };

  return {
    user: (req as any).user,
    userId: (req as any).user?._id,
    logout,
    login,
    remoteAddress,
    remotePort,
    userAgent,
  };
};
