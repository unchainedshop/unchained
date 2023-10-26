import { IncomingMessage } from 'http';
import { UnchainedUserContext } from '@unchainedshop/types/api.js';

export const getUserContext = async (
  req: IncomingMessage & { cookies?: any },
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
      token: (req as any).sessionID,
      /* eslint-disable-next-line */
      tokenExpires: new Date((req as any).session?.cookie._expires),
    };
  };

  const logout = async () => {
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
