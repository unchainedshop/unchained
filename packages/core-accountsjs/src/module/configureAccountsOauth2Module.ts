/// <reference lib="dom" />
import { AccountsOauth2Module, AccessToken, GoogleToken } from '@unchainedshop/types/accounts.js';

export const configureAccountsOauth2Module = async (): Promise<AccountsOauth2Module> => {
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
  return {
    parseGoogleIdToken: (idToken: string): GoogleToken => {
      const [, base64UserInfo] = idToken.split('.');
      const buff = Buffer.from(base64UserInfo, 'base64');
      return JSON.parse(buff.toString());
    },

    requestAccessToken: async (service, authorizationCode): Promise<AccessToken | null> => {
      let result;
      if (service.toUpperCase() === 'GOOGLE') {
        result = await getGoogleAccessToken({
          code: authorizationCode,
          clientId: process.env.OAUTH_CLIENT_ID,
          redirectUri: process.env.OAUTH_REDIRECT_URL,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
        });
      }
      return result;
    },

    getGoogleUserInfo: async (idToken: string): Promise<any> => {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo?alt=json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      return response.json();
    },
    getGoogleAccessToken,
  };
};
