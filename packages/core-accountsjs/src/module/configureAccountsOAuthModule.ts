import { AccountsOAuth2Module } from '@unchainedshop/types/accounts.js';
import { OAuth2Director } from '../director/OAuth2Director.js';

export const configureAccountsOAuthModule = (): AccountsOAuth2Module => {
  return {
    getAuthorizationToken: async (provider, authorizationCode, redirectUrl) => {
      const director = await OAuth2Director.actions({ provider });
      return director.getAuthorizationToken(authorizationCode, redirectUrl);
    },
    getAccountData: async (provider, userAuthorizationToken: any) => {
      const director = await OAuth2Director.actions({ provider });
      return director.getAccountData(userAuthorizationToken);
    },
    isTokenValid: async (provider, token) => {
      const director = await OAuth2Director.actions({ provider });
      return director.isTokenValid(token);
    },
    refreshToken: async (provider, userAuthorizationToken) => {
      const director = await OAuth2Director.actions({ provider });
      return director.refreshToken(userAuthorizationToken);
    },
  };
};
