import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedUserContext } from '@unchainedshop/types/api.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import cookie from 'cookie';

function isString(input) {
  return typeof input === 'string' && Object.prototype.toString.call(input) === '[object String]';
}

const {
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  NODE_ENV,
} = process.env;

export const getUserContext = async (
  req: IncomingMessage & { cookies?: any },
  res: OutgoingMessage,
  unchainedAPI: UnchainedCore,
): Promise<UnchainedUserContext> => {
  // there is a possible current user connected!
  const cookieName = UNCHAINED_COOKIE_NAME;
  const domain = UNCHAINED_COOKIE_DOMAIN;
  const path = UNCHAINED_COOKIE_PATH;

  let loginToken = req.cookies?.[cookieName];

  function setLoginToken(token: string, expires: Date) {
    if (!domain) return;
    const authCookie = cookie.serialize(cookieName, token || null, {
      domain,
      httpOnly: true,
      path,
      expires: token ? expires : undefined,
      maxAge: token ? undefined : -1,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
    });
    res.setHeader('Set-Cookie', authCookie);
  }

  if (req.headers.authorization) {
    const [type, token] = req.headers.authorization.split(' ');
    if (type === 'Bearer') {
      loginToken = token;
    }
  }
  if (loginToken) {
    // throw an error if the token is not a string
    if (!isString(loginToken)) throw new Error('Access Token is not a string');

    // the hashed token is the key to find the possible current user in the db
    const hashedToken = unchainedAPI.modules.accounts.createHashLoginToken(loginToken as string);

    const currentUser = await unchainedAPI.modules.users.findUserByToken(hashedToken);

    // the current user exists
    if (currentUser) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = currentUser.services.resume.loginTokens.find(
        (tokenInfo) => tokenInfo.hashedToken === hashedToken,
      ); // eslint-disable-line

      // true if the token is expired
      const isExpired = new Date(tokenInformation.when) < new Date();

      // if the token is still valid, give access to the current user
      // information in the resolvers context
      if (!isExpired) {
        // return a new context object with the current user & her id
        return {
          user: currentUser,
          userId: currentUser._id,
          loginToken: loginToken as string,
          setLoginToken,
        };
      }
    }
    return { loginToken: loginToken as string, setLoginToken };
  }

  return { setLoginToken };
};
