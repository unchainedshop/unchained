import { Context } from '@unchainedshop/types/api';
import cookie from 'cookie';
import fetch from 'node-fetch';

const { ROOT_URL, NODE_ENV, UNCHAINED_CLOUD_ENDPOINT } = process.env;

const loginWithSingleSignOn = async (remoteToken, unchainedAPI: Context) => {
  try {
    const thisDomain = new URL(ROOT_URL).hostname;
    const result = await fetch(UNCHAINED_CLOUD_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
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

    if (
      thisDomain === 'localhost' ||
      thisDomain === json?.data?.controlConsumeSingleSignOnToken?.domain
    ) {
      // create sso user if not exist and login
      const ssoUserId =
        (await unchainedAPI.modules.users.findUser({ username: 'sso' }))?._id ||
        (await unchainedAPI.modules.accounts.createUser(
          {
            username: 'sso',
            roles: ['admin'],
            email: 'sso@unchained.local',
            profile: { address: {} },
            lastBillingAddress: {},
            password: null,
            guest: false,
          },
          { skipMessaging: true },
        ));
      const { tokenExpires, token } = await unchainedAPI.modules.accounts.createLoginToken(
        ssoUserId,
        unchainedAPI,
      );
      const expires = new Date(tokenExpires || new Date().getTime() + 100000);
      const authCookie = cookie.serialize('token', token, {
        domain: thisDomain || 'localhost',
        httpOnly: true,
        expires,
        path: '/',
        sameSite: 'strict',
        secure: NODE_ENV === 'production',
      });

      return authCookie;
    }
    throw new Error('Invalid token/domain pair');
  } catch (e) {
    console.error(e); // eslint-disable-line
    return null;
  }
};

export default (unchainedApi) => (req, res, next) => {
  if (req.query?.token) {
    loginWithSingleSignOn(req.query.token, unchainedApi).then((authCookie) => {
      if (res?.setHeader) {
        res.writeHead(303, {
          'Set-Cookie': authCookie,
          Location: '/',
        });
        res.end();
      }
    });
  } else {
    next();
  }
};
