import { UnchainedCore } from '@unchainedshop/core';
import instantiateLoaders, { UnchainedLoaders } from './loaders/index.js';
import { getLocaleContext, UnchainedLocaleContext } from './locale-context.js';
import { UnchainedServerOptions } from './api-index.js';
import { User } from '@unchainedshop/core-users';
import { IncomingMessage, OutgoingMessage } from 'node:http';

export type LoginFn = (
  user: User,
  options?: {
    impersonator?: User;
    maxAge?: number;
  },
) => Promise<{ _id: string; tokenExpires: Date }>;

export type LogoutFn = (sessionId?: string) => Promise<boolean>;
export interface UnchainedUserContext {
  login: LoginFn;
  logout: LogoutFn;
  userId?: string;
  impersonatorId?: string;
  accessToken?: string;
  user?: User;
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
  remoteAddress?: string;
  remotePort?: number;
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

export type UnchainedContextResolver<Request = any, Response = any> = (
  params: UnchainedHTTPServerContext & Omit<UnchainedUserContext, 'user'>,
  req?: Request,
  res?: Response,
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
  async ({
    getHeader,
    setHeader,
    remoteAddress,
    remotePort,
    userId,
    impersonatorId,
    accessToken,
    login,
    logout,
  }) => {
    const abstractHttpServerContext = { remoteAddress, remotePort, getHeader, setHeader };
    const loaders = await instantiateLoaders(unchainedAPI);
    const localeContext = await getLocaleContext(abstractHttpServerContext, unchainedAPI);
    const userContext: UnchainedUserContext = { login, logout, impersonatorId };

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
