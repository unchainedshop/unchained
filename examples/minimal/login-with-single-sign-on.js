import cookie from 'cookie';
import fetch from 'isomorphic-unfetch';

const { ROOT_URL, NODE_ENV, UNCHAINED_CLOUD_ENDPOINT } = process.env;

export default async (remoteToken, unchainedAPI) => {
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
          'mutation consume($token: String!) { controlConsumeSingleSignOnToken(token: $token) { domain } }',
      }),
    });
    const json = await result.json();
    if (json?.errors?.length > 0) {
      throw new Error(json.errors[0].message);
    }
    if (
      thisDomain === 'localhost' ||
      !thisDomain === json?.data?.controlConsumeSingleSignOnToken?.domain
    ) {
      // create sso user if not exist and login
      const ssoUser =
        (await unchainedAPI.modules.users.findUser({ username: 'sso' })) ||
        (await unchainedAPI.modules.users.createUser(
          {
            username: 'sso',
            roles: ['admin'],
            email: 'sso@unchained.local',
            profile: { address: {} },
            guest: false,
          },
          {},
          { skipMessaging: true },
        ));
      const { tokenExpires, token } =
        await unchainedAPI.modules.users.createLoginToken(
          ssoUser,
          unchainedAPI,
        );
      const expires = new Date(tokenExpires || new Date().getTime() + 100000);
      const authCookie = cookie.serialize('token', token, {
        domain: thisDomain || 'localhost',
        httpOnly: true,
        expires,
        sameSite: 'strict',
        secure: NODE_ENV === 'production',
      });

      return authCookie;
    }
    throw new Error('Invalid token/domain pair');
  } catch (e) {
    console.error(e);
    return null;
  }
};
