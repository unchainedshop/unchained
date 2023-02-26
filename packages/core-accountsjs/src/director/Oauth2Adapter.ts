/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { log, LogLevel } from '@unchainedshop/logger';
import { IOauth2Adapter } from '@unchainedshop/types/accounts.js';
import { Oauth2Error } from './Oauth2Error.js';

export const Oauth2Adapter: Omit<IOauth2Adapter, 'key' | 'label' | 'version' | 'orderIndex'> = {
  provider: '',

  actions: () => {
    return {
      configurationError: () => {
        return Oauth2Error.NOT_IMPLEMENTED;
      },
      isActive: () => {
        return true;
      },
      getAccessToken: async (authorizationCode: string) => {
        return null;
      },
      getAccountData: async (token: string) => {
        return null;
      },
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
