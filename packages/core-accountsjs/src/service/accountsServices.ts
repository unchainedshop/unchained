/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AccountsServices } from '@unchainedshop/types/accounts.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Oauth2Director } from '../director/Oauth2Director.js';

export const accountsServices: AccountsServices = {
  oauth2: async (params: { provider: string; redirectUrl: string }, unchainedAPI: UnchainedCore) => {
    const { provider, redirectUrl } = params;
    const director = await Oauth2Director.actions({ provider, redirectUrl }, unchainedAPI);
    return {
      getAuthorizationCode: async (authorizationCode) => {
        return director.getAuthorizationCode(authorizationCode);
      },
      linkOauthProvider: async (authorizationCode) => {
        const authorizationToken = await director.getAuthorizationCode(authorizationCode);
        const userData = await director.getAccountData(authorizationToken);
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
    };
  },
};
