/* eslint-disable camelcase */
import { IOAuth2Adapter } from '@unchainedshop/types/accounts.js';
import { OAuth2Director, OAuth2Adapter } from '@unchainedshop/core-accountsjs';

const { LINKED_IN_OAUTH_CLIENT_ID, LINKED_IN_OAUTH_CLIENT_SECRET } = process.env;

const getLinkedInAuthorizationCode = async ({
  code,
  redirectUri,
  clientId,
  clientSecret,
}): Promise<any> => {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    // eslint-disable-next-line
    // @ts-ignore
    duplex: 'half',
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

const normalizeProfileData = (data): any => {
  const { name, given_name, family_name, email, email_verified, picture, sub } = data;
  return {
    id: sub,
    displayName: name,
    firstName: given_name,
    lastName: family_name,
    email: email_verified ? email : undefined,
    avatarUrl: picture,
  };
};

const LinkedInOAuthAdapter: IOAuth2Adapter = {
  ...OAuth2Adapter,
  key: 'linked-in-oauth2',
  label: 'LinkedIn Oauth',
  version: '1',
  provider: 'linkedin',
  config: {
    clientId: LINKED_IN_OAUTH_CLIENT_ID,
    scopes: ['r_liteprofile', 'r_emailaddress', 'email', 'openid', 'profile'],
  },

  actions: () => {
    return {
      ...OAuth2Adapter.actions(null),
      configurationError: () => {
        return '';
      },
      isActive: () => {
        return Boolean(LINKED_IN_OAUTH_CLIENT_ID && LINKED_IN_OAUTH_CLIENT_SECRET);
      },
      getAuthorizationToken: async (authorizationCode, redirectUrl) => {
        return getLinkedInAuthorizationCode({
          code: authorizationCode,
          clientId: LinkedInOAuthAdapter.config.clientId,
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

OAuth2Director.registerAdapter(LinkedInOAuthAdapter);

export default LinkedInOAuthAdapter;
