import type { UnchainedCore } from '@unchainedshop/core';
import instantiateLoaders, { type UnchainedLoaders } from './loaders/index.ts';
import { getLocaleContext, type UnchainedLocaleContext } from './locale-context.ts';
import type { UnchainedServerOptions } from './api-index.ts';
import type { User } from '@unchainedshop/core-users';

const { npm_package_version, UNCHAINED_API_VERSION } = process.env;

export type LoginFn = (
  user: User,
  options?: {
    impersonator?: User;
  },
) => Promise<{ _id: string; tokenExpires: Date }>;

export type LogoutFn = (sessionId?: string) => Promise<boolean>;
export interface UnchainedUserContext {
  login: LoginFn;
  logout: LogoutFn;
  userId?: string;
  impersonatorId?: string;
  accessToken?: string;
  tokenVersion?: number;
  user?: User;
}

export interface CustomAdminUiProperties {
  entityName: string;
  inlineFragment: string;
}

export interface AdminUiConfig {
  customProperties?: CustomAdminUiProperties[];
  singleSignOnURL?: string;
  defaultProductTags?: string[];
  defaultAssortmentTags?: string[];
  defaultUserTags?: string[];
}

export interface UnchainedHTTPServerContext {
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string;
  remoteAddress?: string;
  remotePort?: number;
}

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
    tokenVersion,
    login,
    logout,
  }) => {
    const abstractHttpServerContext = { remoteAddress, remotePort, getHeader, setHeader };
    const loaders = instantiateLoaders(unchainedAPI);
    const localeContext = await getLocaleContext(abstractHttpServerContext, unchainedAPI);

    const userContext: UnchainedUserContext = { login, logout, impersonatorId };

    // First, try API key authentication if accessToken is provided
    if (accessToken) {
      const accessTokenUser = await unchainedAPI.modules.users.findUserByToken(accessToken);
      if (accessTokenUser) {
        userContext.user = accessTokenUser;
        userContext.userId = accessTokenUser._id;
      }
    }

    // Second, try JWT-based authentication if userId is provided from JWT
    if (userId && !userContext.userId) {
      const user = await unchainedAPI.modules.users.findUserById(userId);
      if (user) {
        // Validate token version if provided (from JWT)
        // Token version defaults to 1 for users that haven't had their tokens revoked
        const userTokenVersion = user.tokenVersion ?? 1;
        if (tokenVersion !== undefined && tokenVersion !== userTokenVersion) {
          // Token has been revoked (tokenVersion mismatch), don't authenticate
          // User will remain unauthenticated
        } else {
          userContext.user = user;
          userContext.userId = user._id;
        }
      }
    }

    return {
      ...unchainedAPI,
      ...unchainedConfig,
      ...localeContext,
      ...userContext,
      ...abstractHttpServerContext,
      loaders,
      version: UNCHAINED_API_VERSION || npm_package_version || 'n/a',
    };
  };
