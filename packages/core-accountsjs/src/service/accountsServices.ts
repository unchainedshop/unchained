/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AccountsServices } from '@unchainedshop/types/accounts.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Oauth2Director } from '../director/Oauth2Director.js';

export const accountsServices: AccountsServices = {
  oauth2: (unchainedAPI: UnchainedCore) => ({
    getAccessToken: async (provider, authorizationCode) => {
      const director = await Oauth2Director.actions(provider);
      return director.getAccessToken(authorizationCode);
    },
    getAccountData: async (provider, token) => {
      const director = await Oauth2Director.actions(provider);
      return director.getAccountData(token);
    },
  }),
};
