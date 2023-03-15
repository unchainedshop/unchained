/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AccountsServices } from '@unchainedshop/types/accounts.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Oauth2Director } from '../director/Oauth2Director.js';

export const accountsServices: AccountsServices = {
  oauth2: async (params: { provider: string }, unchainedAPI: UnchainedCore) => {
    const { provider } = params;
    const director = await Oauth2Director.actions({ provider }, unchainedAPI);
    return {
      getAuthorizationCode: async (authorizationCode, redirectUrl) => {
        return director.getAuthorizationCode(authorizationCode, redirectUrl);
      },
      getAccountData: async (userAuthorizationToken: any) => {
        return director.getAccountData(userAuthorizationToken);
      },
      isTokenValid: async (token) => {
        return director.isTokenValid(token);
      },
      refreshToken: async (userAuthorizationToken) => {
        return director.refreshToken(userAuthorizationToken);
      },
      linkOauthProvider: async (userId, { data, authorizationToken, authorizationCode }) => {
        if (!userId || !data?.email)
          throw new Error('Invalid parameter userId and data.email are required');
        if (!authorizationToken || !authorizationCode)
          throw new Error('authorizationToken and authorizationCode are required');

        const user = await unchainedAPI.modules.users.findUser({
          [`services.oauth.${provider?.toLowerCase()}.data.email`]: data.email,
        });
        if (user)
          throw new Error('EmailAlreadyExists', {
            cause: { message: 'EmailAlreadyExists', name: 'EmailAlreadyExists' },
          });

        await unchainedAPI.modules.users.updateUser(
          { _id: userId },
          {
            $push: {
              [`services.oauth.${provider?.toLowerCase()}`]: {
                data,
                authorizationToken,
                authorizationCode,
              },
            },
          },
          { upsert: true },
        );
        return unchainedAPI.modules.users.findUserById(userId);
      },
      unLinkOauthProvider: async (userId, authorizationCode) => {
        await unchainedAPI.modules.users.updateUser(
          { _id: userId },
          {
            $pull: {
              [`services.oauth.${provider?.toLowerCase()}`]: authorizationCode,
            },
          },
          { upsert: true },
        );
        return unchainedAPI.modules.users.findUserById(userId);
      },
    };
  },
};
