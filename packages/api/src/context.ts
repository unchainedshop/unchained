import { UnchainedCore } from '@unchainedshop/core';
import instantiateLoaders, { UnchainedLoaders } from './loaders/index.js';
import { getLocaleContext, UnchainedLocaleContext } from './locale-context.js';
import { UnchainedServerOptions } from './api-index.js';
import { User } from '@unchainedshop/core-users';

export interface UnchainedUserContext {
  login: (user: User) => Promise<{ _id: string; tokenExpires: Date }>;
  logout: () => Promise<boolean>;
  userId?: string;
  user?: User;
  remoteAddress?: string;
  remotePort?: string;
  userAgent?: string;
}

export interface CustomAdminUiProperties {
  entityName: string;
  inlineFragment: string;
}

export interface AdminUiConfig {
  customProperties?: CustomAdminUiProperties[];
}

export type UnchainedHTTPServerContext = {
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string;
};

export type Context = UnchainedCore & {
  version?: string;
  roles?: any;
  adminUiConfig?: AdminUiConfig;
  loaders: UnchainedLoaders;
} & UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedHTTPServerContext;

let context;

export const getCurrentContextResolver = (): UnchainedContextResolver => context;

export const setCurrentContextResolver = (newContext: UnchainedContextResolver) => {
  context = newContext;
};

export type UnchainedContextResolver = (
  params: UnchainedHTTPServerContext & {
    remoteAddress?: string;
    remotePort?: number;
    userId?: string;
    login: (user: any) => Promise<{ _id: string; user: any; tokenExpires: Date }>;
    accessToken?: string;
    logout: () => Promise<boolean>;
  },
) => Promise<Context>;

const { default: packageJson } = await import(`${import.meta.dirname}/../package.json`, {
  with: { type: 'json' },
});
const { UNCHAINED_API_VERSION = packageJson?.version || '3.x' } = process.env;

export const createContextResolver =
  (
    unchainedAPI: UnchainedCore,
    unchainedConfig: Pick<UnchainedServerOptions, 'roles' | 'adminUiConfig'>,
  ): UnchainedContextResolver =>
  async ({ getHeader, setHeader, remoteAddress, remotePort, userId, accessToken, login, logout }) => {
    const abstractHttpServerContext = { remoteAddress, remotePort, getHeader, setHeader };
    const loaders = await instantiateLoaders(unchainedAPI);
    const localeContext = await getLocaleContext(abstractHttpServerContext, unchainedAPI);
    const userContext: UnchainedUserContext = { login, logout };

    if (accessToken) {
      const accessTokenUser = await unchainedAPI.modules.users.findUserByToken(accessToken);
      if (accessTokenUser) {
        userContext.user = accessTokenUser;
        userContext.userId = accessTokenUser._id;
      }
    }
    if (userId && !userContext.userId) {
      userContext.user = await unchainedAPI.modules.users.findUserById(userId);
      userContext.userId = userId;
    }

    return {
      ...unchainedAPI,
      ...unchainedConfig,
      ...localeContext,
      ...userContext,
      loaders,
      version: UNCHAINED_API_VERSION,
      setHeader,
      getHeader,
    };
  };
