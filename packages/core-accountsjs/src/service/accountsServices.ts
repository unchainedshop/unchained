/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AccountsServices } from '@unchainedshop/types/accounts.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Oauth2Director } from '../director/Oauth2Director.js';

export const accountsServices: AccountsServices = {
  oauth2: async (provider: string, unchainedAPI: UnchainedCore) => {
    const director = await Oauth2Director.actions(provider);
    return {
      getAuthorizationCode: async (authorizationCode) => {
        return director.getAuthorizationCode(authorizationCode);
      },
      getAccountData: async (token) => {
        return director.getAccountData(token);
      },
      isTokenValid: async (token) => {
        return director.isTokenValid(token);
      },
      parseAccessToken: (accessToken) => {
        return director.parseAccessToken(accessToken);
      },
      revokeAccessToken: async (authorizationCode) => {
        return director.revokeAccessToken(authorizationCode);
      },
    };
  },
};
