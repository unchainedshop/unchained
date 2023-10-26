import { UnchainedContextResolver, AdminUiConfig } from '@unchainedshop/types/api.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import instantiateLoaders from './loaders/index.js';
import { getLocaleContext } from './locale-context.js';
import { getUserContext } from './user-context.js';

let context;

export const getCurrentContextResolver = (): UnchainedContextResolver => context;

export const setCurrentContextResolver = (newContext: UnchainedContextResolver) => {
  context = newContext;
};

export const createContextResolver =
  (
    unchainedAPI: UnchainedCore,
    roles: any,
    version: string,
    adminUiConfig?: AdminUiConfig,
  ): UnchainedContextResolver =>
  async ({ req, res, ...apolloContext }) => {
    const loaders = await instantiateLoaders(req, res, unchainedAPI);
    const userContext = await getUserContext(req, res, unchainedAPI);
    const localeContext = await getLocaleContext(req, res, unchainedAPI);

    return {
      req,
      res,
      ...apolloContext,
      ...unchainedAPI,
      ...userContext,
      ...localeContext,
      loaders,
      roles,
      version,
      adminUiConfig,
    };
  };
