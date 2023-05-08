/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { log, LogLevel } from '@unchainedshop/logger';
import { IOAuth2Adapter } from '@unchainedshop/types/accounts.js';
import { OAuth2Error } from './OAuth2Error.js';

export const OAuth2Adapter: Omit<IOAuth2Adapter, 'key' | 'label' | 'version' | 'orderIndex'> = {
  provider: '',
  config: null,

  actions: () => {
    return {
      configurationError: () => {
        throw new Error(OAuth2Error.NOT_IMPLEMENTED);
      },
      isActive: () => {
        return true;
      },
      getAuthorizationToken: async (authorizationCode: string, redirectUrl: string) => {
        return null;
      },
      getAccountData: async (userAuthorizationToken: any) => {
        return null;
      },
      isTokenValid: async (token) => {
        return false;
      },
      refreshToken: async (userAuthorizationToken: any) => {
        throw new Error(OAuth2Error.NOT_IMPLEMENTED);
      },
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
