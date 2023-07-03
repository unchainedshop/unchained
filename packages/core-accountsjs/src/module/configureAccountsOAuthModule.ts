import { AccountsOAuth2Module } from '@unchainedshop/types/accounts.js';
import { OAuth2Director } from '../director/OAuth2Director.js';

export const configureAccountsOAuthModule = (): AccountsOAuth2Module => {
  return {
    getAuthorizationToken: async (provider, authorizationCode, redirectUrl) => {
      const director = await OAuth2Director.actions({ provider });
      return director.getAuthorizationToken(authorizationCode, redirectUrl);
    },
    getAccountData: async (provider, userAuthorizationToken) => {
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
    getProviders: async () => {
      const providers = await OAuth2Director.getAdapters({
        adapterFilter: (adapter) => {
          return adapter.actions({}).isActive();
        },
      });
      return providers;
    },
    getProvider: async (provider) => {
      const providerObj = await OAuth2Director.getAdapter(provider);
      return providerObj;
    },
  };
};
