/* eslint-disable camelcase */
import { AccessToken, IOauth2Adapter, UserOauthData } from '@unchainedshop/types/accounts.js';

import { Oauth2Director, Oauth2Adapter } from '@unchainedshop/core-accountsjs';

const getGoggleAuthorizationCode = async ({
  code,
  redirectUri,
  clientId,
  clientSecret,
}): Promise<AccessToken> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
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
      access_type: 'offline',
    }),
  });

  return response.json();
};

const normalizeProfileData = (data): UserOauthData => {
  const { names, genders, addresses, emailAddresses, phoneNumbers, birthdays, photos } = data;

  return {
    firstName: names?.[0]?.givenName,
    lastName: names?.[0]?.familyName,
    displayName: names?.[0]?.displayName,
    gender: genders?.[0]?.value,
    email: emailAddresses[0]?.value,
    birthDate: birthdays?.[0]?.date
      ? new Date(
          birthdays?.[0]?.date?.year,
          birthdays?.[0]?.date?.month,
          birthdays?.[0]?.date?.day,
          0,
          0,
          0,
        )
      : undefined,
    phoneNumber: phoneNumbers?.[0]?.canonicalForm,
    address: addresses[0]?.formattedValue,
    avatarUrl: photos[0]?.url,
  };
};

const parseGoogleIdToken = (idToken: string): UserOauthData => {
  const [, base64UserInfo] = idToken.split('.');
  const buff = Buffer.from(base64UserInfo, 'base64');
  const data = JSON.parse(buff.toString());

  return {
    email: data?.email,
    firstName: data?.given_name,
    lastName: data?.family_name,
    avatarUrl: data?.picture,
    fullName: data?.name,
    exp: data?.exp,
    ...data,
  };
};

const GoogleOauth2Adapter: IOauth2Adapter = {
  ...Oauth2Adapter,
  key: 'google-oauth2',
  label: 'Google Oauth',
  version: '1',
  provider: 'google',

  actions: () => {
    return {
      ...Oauth2Adapter.actions(),
      configurationError: () => {
        return '';
      },
      isActive: () => {
        return true;
      },
      getAuthorizationCode: async (authorizationCode) => {
        return getGoggleAuthorizationCode({
          code: authorizationCode,
          clientId: process.env.OAUTH_CLIENT_ID,
          redirectUri: process.env.OAUTH_REDIRECT_URL,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
        });
      },
      getAccountData: async ({ access_token, id_token }: any) => {
        const response = await fetch(
          'https://people.googleapis.com/v1/people/me?personFields=genders,emailAddresses,phoneNumbers,addresses,birthdays,metadata,names,photos,locations',
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );
        if (response.status === 403) return parseGoogleIdToken(id_token);

        const profileInfoJSON = await response.json();

        return normalizeProfileData(profileInfoJSON);
      },
      isTokenValid: async (accessToken) => {
        const response = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${accessToken?.id_token}`,
        );

        const tokenInfo = await response.json();

        if (tokenInfo.error) {
          return false;
        }

        return true;
      },
      revokeAccessToken: async (authorizationCode) => {
        const response = await fetch(
          `https://accounts.google.com/o/oauth2/revoke?token=${authorizationCode}`,
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

Oauth2Director.registerAdapter(GoogleOauth2Adapter);

export default GoogleOauth2Adapter;
