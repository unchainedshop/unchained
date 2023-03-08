/* eslint-disable camelcase */
import { AccessToken, IOauth2Adapter, UserOauthData } from '@unchainedshop/types/accounts.js';

import { Oauth2Director, Oauth2Adapter } from '@unchainedshop/core-accountsjs';

const { LINKED_IN_OAUTH_CLIENT_ID, LINKED_IN_OAUTH_CLIENT_SECRET } = process.env;

const getLinkedInAuthorizationCode = async ({
  code,
  redirectUri,
  clientId,
  clientSecret,
}): Promise<AccessToken> => {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      grant_type: 'authorization_code',
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  return response.json();
};

const normalizeProfileData = (data): UserOauthData => {
  const { name, given_name, family_name, email, picture } = data;
  return {
    displayName: name,
    firstName: given_name,
    lastName: family_name,
    email,
    avatarUrl: picture,
  };
};

const LinkedInOauthAdapter: IOauth2Adapter = {
  ...Oauth2Adapter,
  key: 'linked-in-oauth2',
  label: 'LinkedIn Oauth',
  version: '1',
  provider: 'linkedin',
  config: {
    clientId: LINKED_IN_OAUTH_CLIENT_ID,
    scopes: ['r_liteprofile', 'r_emailaddress', 'email', 'openid', 'profile'],
  },

  actions: ({ redirectUrl }, context) => {
    return {
      ...Oauth2Adapter.actions({ redirectUrl }, context),
      configurationError: () => {
        return '';
      },
      isActive: () => {
        return true;
      },
      getAuthorizationCode: async (authorizationCode) => {
        return getLinkedInAuthorizationCode({
          code: authorizationCode,
          clientId: LinkedInOauthAdapter.config.clientId,
          redirectUri: redirectUrl,
          clientSecret: LINKED_IN_OAUTH_CLIENT_SECRET,
        });
      },
      getAccountData: async ({ access_token }: any) => {
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const profileInfoJSON = await response.json();

        return normalizeProfileData(profileInfoJSON);
      },
      isTokenValid: async ({ access_token }) => {
        const response = await fetch(
          `https://api.linkedin.com/oauth/v2/accessTokenValidation?q=full&access_token=${access_token}`,
        );

        const tokenInfo = await response.json();

        if (tokenInfo.error) {
          return false;
        }

        return true;
      },
    };
  },
};

Oauth2Director.registerAdapter(LinkedInOauthAdapter);

export default LinkedInOauthAdapter;
