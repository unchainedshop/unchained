import { BaseDirector } from '@unchainedshop/utils';
import { IOauth2Adapter, IOauthDirector } from '@unchainedshop/types/accounts.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { Oauth2Error } from './Oauth2Error.js';

const baseDirector = BaseDirector<IOauth2Adapter>('Oauth2Director', {
  adapterKeyField: 'provider',
});

export const Oauth2Director: IOauthDirector = {
  ...baseDirector,

  actions: async ({ provider, redirectUrl }, context) => {
    const Adapter = baseDirector.getAdapter(provider);
    if (!Adapter) {
      throw new Error(`Oauth Plugin for ${provider} not available`);
    }

    const adapter = Adapter.actions({ redirectUrl }, context);

    return {
      configurationError: () => {
        try {
          return adapter.configurationError();
        } catch (error) {
          throw new Error(Oauth2Error.ADAPTER_NOT_FOUND);
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
      isTokenValid: async (token) => {
        return adapter.isTokenValid(token);
      },

      getAuthorizationCode: async (value) => {
        try {
          return adapter.getAuthorizationCode(value);
        } catch (error) {
          log('Oauth2 Director -> Error while get accounts access information', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },
      refreshToken: async (userAuthorizationToken) => {
        return adapter.refreshToken(userAuthorizationToken);
      },

      getAccountData: async (userAuthorizationToken: any) => {
        try {
          return adapter.getAccountData(userAuthorizationToken);
        } catch (error) {
          log('Oauth2 Director -> Error while getting account data', {
            level: LogLevel.Warning,
            ...error,
          });
          return null;
        }
      },
    };
  },
};
