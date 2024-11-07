import { IncomingMessage } from 'http';
import { createLogger } from '@unchainedshop/logger';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import cookie from 'cookie';
import { getCurrentContextResolver } from '../context.js';

const {
  NODE_ENV,
  UNCHAINED_CLOUD_ENDPOINT,
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_DOMAIN,
} = process.env;

const logger = createLogger('unchained:unchained-cloud-sso');

const loginWithSingleSignOn = async (remoteToken, context: UnchainedCore) => {
  const domain = UNCHAINED_COOKIE_DOMAIN;
  const result = await fetch(UNCHAINED_CLOUD_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    duplex: 'half',
    body: JSON.stringify({
      operationName: 'consume',
      variables: {
        token: remoteToken,
      },
      query:
        'mutation consume($token: ID!) { controlConsumeSingleSignOnToken(token: $token) { domain } }',
    }),
  });
  const json: any = await result.json();
  if (json?.errors?.length > 0) {
    throw new Error(json.errors[0].message);
  }

  if (domain === 'localhost' || domain === json?.data?.controlConsumeSingleSignOnToken?.domain) {
    // create sso user if not exist and login
    const ssoUserId =
      (await context.modules.users.findUser({ username: 'sso' }))?._id ||
      (await context.modules.accounts.createUser(
        {
          username: 'sso',
          roles: ['admin'],
          email: 'sso@unchained.local',
          password: null,
          guest: false,
        },
        { skipMessaging: true },
      ));
    const { tokenExpires, token } = await context.modules.accounts.createLoginToken(ssoUserId, context);
    const expires = new Date(tokenExpires || new Date().getTime() + 100000);
    const authCookie = cookie.serialize(UNCHAINED_COOKIE_NAME, token, {
      domain,
      httpOnly: true,
      expires,
      path: '/',
      sameSite: 'strict',
      secure: NODE_ENV === 'production',
    });

    return authCookie;
  }
  throw new Error('Invalid token/domain pair');
};

export default async function singleSignOnMiddleware(req: IncomingMessage & { query?: any }, res, next) {
  try {
    if (req.query?.token && UNCHAINED_CLOUD_ENDPOINT) {
      const contextResolver = getCurrentContextResolver();
      const context = await contextResolver({ req, res });
      const authCookie = await loginWithSingleSignOn(req.query.token, context);

      if (authCookie) {
        res.writeHead(303, {
          'Set-Cookie': authCookie,
          Location: '/',
        });
        res.end();
        return;
      }
    }
  } catch (e) {
    logger.error(e.message);
  }
  next();
}
