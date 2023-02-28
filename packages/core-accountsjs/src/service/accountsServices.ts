/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AccountsServices } from '@unchainedshop/types/accounts.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Oauth2Director } from '../director/Oauth2Director.js';

export const accountsServices: AccountsServices = {
  oauth2: async (params: { provider: string; redirectURL: string }, unchainedAPI: UnchainedCore) => {
    const { provider, redirectURL } = params;
    const director = await Oauth2Director.actions({ provider, redirectURL }, unchainedAPI);
    return {
      getAuthorizationCode: async (authorizationCode) => {
        return director.getAuthorizationCode(authorizationCode);
      },
      getAccountData: async (userAuthorizationToken: any) => {
        return director.getAccountData(userAuthorizationToken);
      },
      isTokenValid: async (token) => {
        return director.isTokenValid(token);
      },
      revokeAccessToken: async (authorizationToken) => {
        return director.revokeAccessToken(authorizationToken);
      },
      refreshToken: async (userAuthorizationToken) => {
        return director.refreshToken(userAuthorizationToken);
      },
    };
  },
};
