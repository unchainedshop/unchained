import { BaseDirector } from '@unchainedshop/utils';
import { IOauth2Adapter, IOauthDirector } from '@unchainedshop/types/accounts.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { Oauth2Error } from './Oauth2Error.js';

const baseDirector = BaseDirector<IOauth2Adapter>('Oauth2Director', {
  adapterKeyField: 'provider',
});

export const Oauth2Director: IOauthDirector = {
  ...baseDirector,

  actions: async (provider) => {
    const Adapter = baseDirector.getAdapter(provider?.toUpperCase());
    if (!Adapter) {
      throw new Error(`Oauth Plugin for ${provider} not available`);
    }

    const adapter = Adapter.actions(null, null);

    return {
      configurationError: () => {
        try {
          return adapter.configurationError();
        } catch (error) {
          return Oauth2Error.ADAPTER_NOT_FOUND;
        }
      },

      isActive: () => {
        try {
          return adapter.isActive();
        } catch (error) {
          log('Oauth Director -> Error while checking if is active', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },

      getAccessToken: async (value) => {
        try {
          return adapter.getAccessToken(value);
        } catch (error) {
          log('Oauth2 Director -> Error while get accounts access information', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },

      getAccountData: async (token) => {
        try {
          return adapter.getAccountData(token);
        } catch (error) {
          log('Oauth2 Director -> Error while getting account data', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },
    };
  },
};
