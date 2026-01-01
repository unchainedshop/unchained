import type { UnchainedCore } from '@unchainedshop/core';
import instantiateLoaders, { type UnchainedLoaders } from './loaders/index.ts';
import { getLocaleContext, type UnchainedLocaleContext } from './locale-context.ts';
import type { UnchainedServerOptions } from './api-index.ts';
import type { User } from '@unchainedshop/core-users';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:context');
const { npm_package_version, UNCHAINED_API_VERSION } = process.env;

export interface LoginResult {
  _id: string; // Access token
  tokenExpires: Date;
}

export type LoginFn = (user: User, options?: { impersonator?: User }) => Promise<LoginResult>;
export type LogoutFn = () => Promise<boolean>;

export interface UnchainedUserContext {
  login: LoginFn;
  logout: LogoutFn;
  userId?: string;
  impersonatorId?: string;
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

let context: UnchainedContextResolver;

export const getCurrentContextResolver = (): UnchainedContextResolver => context;
export const setCurrentContextResolver = (newContext: UnchainedContextResolver) => {
  context = newContext;
};

export type UnchainedContextResolver<Request = any, Response = any> = (
  params: UnchainedHTTPServerContext & Omit<UnchainedUserContext, 'user'> & { tokenVersion?: number; accessToken?: string },
  req?: Request,
  res?: Response,
) => Promise<Context>;

export const createContextResolver =
  (
    unchainedAPI: UnchainedCore,
    unchainedConfig: Pick<UnchainedServerOptions, 'roles' | 'adminUiConfig'>,
  ): UnchainedContextResolver =>
  async ({ getHeader, setHeader, remoteAddress, remotePort, userId, impersonatorId, tokenVersion, accessToken, login, logout }) => {
    const loaders = instantiateLoaders(unchainedAPI);
    const localeContext = await getLocaleContext({ getHeader }, unchainedAPI);

    const userContext: UnchainedUserContext = { login, logout, impersonatorId };

    // Try API key authentication first (accessToken is raw token when JWT verification failed)
    if (accessToken) {
      const accessTokenUser = await unchainedAPI.modules.users.findUserByToken(accessToken);
      if (accessTokenUser) {
        userContext.user = accessTokenUser;
        userContext.userId = accessTokenUser._id;
      }
    }

    // Resolve user from JWT userId (only if not already authenticated via API key)
    if (userId && !userContext.userId) {
      const user = await unchainedAPI.modules.users.findUserById(userId);
      if (user) {
        // Validate token version if present (local JWT tokens have version)
        if (tokenVersion !== undefined && user.tokenVersion !== tokenVersion) {
          logger.debug(`Token version mismatch for user ${userId}: token=${tokenVersion}, user=${user.tokenVersion}`);
          // Don't set user - token has been revoked via logoutAllSessions
        } else {
          userContext.user = user;
          userContext.userId = user._id;
        }
      } else {
        logger.debug(`User ${userId} not found`);
      }
    }

    return {
      ...unchainedAPI,
      ...unchainedConfig,
      ...localeContext,
      ...userContext,
      setHeader,
      getHeader,
      remoteAddress,
      remotePort,
      loaders,
      version: UNCHAINED_API_VERSION || npm_package_version || 'n/a',
    };
  };
