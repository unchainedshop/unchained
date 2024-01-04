/* eslint-disable camelcase */
import { IOAuth2Adapter } from '@unchainedshop/types/accounts.js';
import { OAuth2Director, OAuth2Adapter } from '@unchainedshop/core-accountsjs';

const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } = process.env;

const getGoggleAuthorizationCode = async ({
  code,
  redirectUri,
  clientId,
  clientSecret,
}): Promise<any> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // eslint-disable-next-line
    // @ts-ignore
    duplex: 'half',
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

const normalizeProfileData = (data) => {
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
    id: data.sub,
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

const parseGoogleIdToken = (idToken: string) => {
  const [, base64UserInfo] = idToken.split('.');
  const buff = Buffer.from(base64UserInfo, 'base64');
  const data = JSON.parse(buff.toString());

  return {
    id: data.sub,
    email: data?.email,
    firstName: data?.given_name,
    lastName: data?.family_name,
    avatarUrl: data?.picture,
    fullName: data?.name,
    exp: data?.exp,
    ...data,
  };
};

const GoogleOAuth2Adapter: IOAuth2Adapter = {
  ...OAuth2Adapter,
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

  actions: () => {
    return {
      ...OAuth2Adapter.actions(null),
      configurationError: () => {
        return '';
      },
      isActive: () => {
        return Boolean(GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET);
      },
      getAuthorizationToken: async (authorizationCode, redirectUrl) => {
        return getGoggleAuthorizationCode({
          code: authorizationCode,
          clientId: GoogleOAuth2Adapter.config.clientId,
          redirectUri: redirectUrl,
          clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
        });
      },
      getAccountData: async ({ access_token, id_token }: any) => {
        const response = await fetch(
          `https://people.googleapis.com/v1/people/me?personFields=${GoogleOAuth2Adapter.config.scopes.join(
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
      refreshToken: async ({ refresh_token }) => {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          // eslint-disable-next-line
          // @ts-ignore
          duplex: 'half',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: GoogleOAuth2Adapter.config.clientId,
            grant_type: 'refresh_token',
            client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
            refresh_token,
            access_type: 'offline',
          }),
        });

        const refreshedAccessToken = await response.json();

        return refreshedAccessToken;
      },
    };
  },
};

OAuth2Director.registerAdapter(GoogleOAuth2Adapter);

export default GoogleOAuth2Adapter;
