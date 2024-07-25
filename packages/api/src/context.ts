import { AdminUiConfig, Context, UnchainedHTTPServerContext } from '@unchainedshop/types/api.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import instantiateLoaders from './loaders/index.js';
import { getLocaleContext } from './locale-context.js';
import { getUserContext } from './user-context.js';

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
  },
) => Promise<Context>;

export const createContextResolver =
  (
    unchainedAPI: UnchainedCore,
    roles: any,
    version: string,
    adminUiConfig?: AdminUiConfig,
  ): UnchainedContextResolver =>
  async ({ getHeader, setHeader, cookies, remoteAddress, remotePort }) => {
    const abstractHttpServerContext = { remoteAddress, remotePort, getHeader, setHeader, cookies };
    const loaders = await instantiateLoaders(unchainedAPI);
    const userContext = await getUserContext(abstractHttpServerContext, unchainedAPI);
    const localeContext = await getLocaleContext(abstractHttpServerContext, unchainedAPI);

    return {
      ...unchainedAPI,
      ...userContext,
      ...localeContext,
      loaders,
      roles,
      version,
      adminUiConfig,
      setHeader,
      getHeader,
    };
  };
