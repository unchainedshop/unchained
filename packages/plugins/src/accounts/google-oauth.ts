import { AccessToken, GoogleToken, IOauth2Adapter } from '@unchainedshop/types/accounts.js';

import { Oauth2Director, Oauth2Adapter } from '@unchainedshop/core-accountsjs';

const getGoogleAccessToken = async ({
  code,
  redirectUri,
  clientId,
  clientSecret,
}): Promise<AccessToken> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: clientId,
      grant_type: 'authorization_code',
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  return response.json();
};

const parseGoogleIdToken = (idToken: string): GoogleToken => {
  const [, base64UserInfo] = idToken.split('.');
  const buff = Buffer.from(base64UserInfo, 'base64');
  return JSON.parse(buff.toString());
};

const GoogleOauth2Adapter: IOauth2Adapter = {
  ...Oauth2Adapter,
  key: 'google-oauth2',
  label: 'Google Oauth',
  version: '1',
  provider: 'GOOGLE',

  actions: (config, context) => {
    return {
      ...Oauth2Adapter.actions(config, context),
      configurationError: () => {
        return '';
      },
      isActive: () => {
        return true;
      },
      getAccessToken: async (authorizationCode) => {
        const oauthAccessToken = await getGoogleAccessToken({
          code: authorizationCode,
          clientId: process.env.OAUTH_CLIENT_ID,
          redirectUri: process.env.OAUTH_REDIRECT_URL,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
        });
        return parseGoogleIdToken(oauthAccessToken.id_token);
      },
      getAccountData: async (token: string) => {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo?alt=json', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        return response.json();
      },
    };
  },
};

Oauth2Director.registerAdapter(GoogleOauth2Adapter);

export default GoogleOauth2Adapter;
