import { BaseDirector } from '@unchainedshop/utils';
import { IOAuth2Adapter, IOAuthDirector } from '@unchainedshop/types/accounts.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { OAuth2Error } from './OAuth2Error.js';

const baseDirector = BaseDirector<IOAuth2Adapter>('OAuth2Director', {
  adapterKeyField: 'provider',
});

export const OAuth2Director: IOAuthDirector = {
  ...baseDirector,

  actions: async ({ provider }) => {
    const Adapter = baseDirector.getAdapter(provider);
    if (!Adapter) {
      throw new Error(`OAuth Plugin for ${provider} not available`);
    }

    const adapter = Adapter.actions(null);

    return {
      configurationError: () => {
        try {
          return adapter.configurationError();
        } catch {
          throw new Error(OAuth2Error.ADAPTER_NOT_FOUND);
        }
      },
      isActive: () => {
        try {
          return adapter.isActive();
        } catch (error) {
          log('OAuth Director -> Error while checking if is active', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },
      isTokenValid: async (token) => {
        return adapter.isTokenValid(token);
      },

      getAuthorizationToken: async (value, redirectUrl) => {
        try {
          const token = await adapter.getAuthorizationToken(value, redirectUrl);
          return token;
        } catch (error) {
          log('OAuth2 Director -> Error while get accounts access information', {
            level: LogLevel.Warning,
            ...error,
          });
          return null;
        }
      },
      refreshToken: async (userAuthorizationToken) => {
        return adapter.refreshToken(userAuthorizationToken);
      },

      getAccountData: async (userAuthorizationToken: any) => {
        try {
          const data = await adapter.getAccountData(userAuthorizationToken);
          return data;
        } catch (error) {
          log('OAuth2 Director -> Error while getting account data', {
            level: LogLevel.Warning,
            ...error,
          });
          return null;
        }
      },
    };
  },
};
