import { AdminUiConfig, Context, UnchainedHTTPServerContext } from '@unchainedshop/types/api.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import instantiateLoaders from './loaders/index.js';
import { getLocaleContext } from './locale-context.js';

let context;

export const getCurrentContextResolver = (): UnchainedContextResolver => context;

export const setCurrentContextResolver = (newContext: UnchainedContextResolver) => {
  context = newContext;
};

export type UnchainedContextResolver = (
  params: UnchainedHTTPServerContext & {
    cookies?: Record<string, string>;
    remoteAddress?: string;
    remotePort?: number;
    user?: any;
    userId?: string;
    login: (user: any) => Promise<{ _id: string; user: any; tokenExpires: Date }>;
    logout: () => Promise<boolean>;
  },
) => Promise<Context>;

export const createContextResolver =
  (
    unchainedAPI: UnchainedCore,
    roles: any,
    version: string,
    adminUiConfig?: AdminUiConfig,
  ): UnchainedContextResolver =>
  async ({ getHeader, setHeader, cookies, remoteAddress, remotePort, user, userId, login, logout }) => {
    const abstractHttpServerContext = { remoteAddress, remotePort, getHeader, setHeader, cookies };
    const loaders = await instantiateLoaders(unchainedAPI);
    const localeContext = await getLocaleContext(abstractHttpServerContext, unchainedAPI);

    return {
      ...unchainedAPI,
      ...localeContext,
      user,
      userId,
      login,
      logout,
      loaders,
      roles,
      version,
      adminUiConfig,
      setHeader,
      getHeader,
    };
  };
