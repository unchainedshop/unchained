import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedUserContext } from '@unchainedshop/types/api.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';

export const getUserContext = async (
  req: IncomingMessage & { cookies?: any },
  res: OutgoingMessage, // eslint-disable-line
  unchainedAPI: UnchainedCore, // eslint-disable-line
): Promise<UnchainedUserContext> => {
  const login = async (user) => {
    await new Promise((resolve, reject) => {
      (req as any).login(user, (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });

    /* eslint-disable-next-line */
    (user as any)._inLoginMethodResponse = true;
    return {
      _id: (req as any).sessionID,
      /* eslint-disable-next-line */
      tokenExpires: new Date((req as any).session?.cookie._expires),
    };
  };

  const logout = async (sessionId?: string) => { /* eslint-disable-line */
    // TODO: this should only logout an explicitly provided session if sessionID
    // has been provided
    // express-session destroy
    await new Promise((resolve, reject) => {
      (req as any).logout((error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });
  };

  return {
    user: (req as any).user,
    userId: (req as any).user?._id,
    logout,
    login,
  };
};
