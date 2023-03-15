/* eslint-disable camelcase */
import { AccessToken, IOauth2Adapter, UserOauthData } from '@unchainedshop/types/accounts.js';

import { Oauth2Director, Oauth2Adapter } from '@unchainedshop/core-accountsjs';

const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } = process.env;

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
  const {
    names = [],
    genders = [],
    addresses = [],
    emailAddresses = [],
    phoneNumbers = [],
    birthdays = [],
    photos = [],
  } = data;
  const [name] = names;
  const [gender] = genders;
  const [email] = emailAddresses;
  const [birthday] = birthdays;
  const [phone] = phoneNumbers;
  const [address] = addresses;
  const [photo] = photos;

  return {
    firstName: name?.givenName,
    lastName: name?.familyName,
    displayName: name?.displayName,
    gender: gender?.value,
    email: email?.value,
    birthDate: birthday?.date
      ? new Date(birthday?.date?.year ?? 0, birthdays?.date?.month ?? 0, birthday?.date?.day ?? 0)
      : undefined,
    phoneNumber: phone?.canonicalForm,
    address: address?.formattedValue,
    avatarUrl: photo?.url,
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
  config: {
    clientId: GOOGLE_OAUTH_CLIENT_ID,
    scopes: [
      'genders',
      'emailAddresses',
      'phoneNumbers',
      'addresses',
      'birthdays',
      'metadata',
      'names',
      'photos',
      'locations',
    ],
  },

  actions: (_, context) => {
    return {
      ...Oauth2Adapter.actions(null, context),
      configurationError: () => {
        return '';
      },
      isActive: () => {
        return true;
      },
      getAuthorizationCode: async (authorizationCode, redirectUrl) => {
        return getGoggleAuthorizationCode({
          code: authorizationCode,
          clientId: GoogleOauth2Adapter.config.clientId,
          redirectUri: redirectUrl,
          clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
        });
      },
      getAccountData: async ({ access_token, id_token }: any) => {
        const response = await fetch(
          `https://people.googleapis.com/v1/people/me?personFields=${GoogleOauth2Adapter.config.scopes.join(
            ',',
          )}`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );
        if (response.status === 403) return parseGoogleIdToken(id_token);
        const profileInfoJSON = await response.json();
        if (profileInfoJSON?.error) throw new Error(profileInfoJSON?.error.message);

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
    };
  },
};

Oauth2Director.registerAdapter(GoogleOauth2Adapter);

export default GoogleOauth2Adapter;
