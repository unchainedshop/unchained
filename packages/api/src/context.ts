import { UnchainedAPI, UnchainedContextResolver } from '@unchainedshop/types/api';
import { IncomingMessage } from 'http';
import instantiateLoaders from './loaders';
import { getLocaleContext } from './locale-context';
import { getUserContext } from './user-context';

let context;

export const getCurrentContextResolver = (): UnchainedContextResolver => context;

export const setCurrentContextResolver = (newContext: UnchainedContextResolver) => {
  context = newContext;
};

export const createContextResolver =
  (unchainedAPI: UnchainedAPI, roles: any, version: string): UnchainedContextResolver =>
  async ({ req, res, ...apolloContext }) => {
    const loaders = await instantiateLoaders(req, unchainedAPI);
    const userContext = await getUserContext(req, unchainedAPI);
    const localeContext = await getLocaleContext(req, unchainedAPI);

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
    };
  };

export const useMiddlewareWithCurrentContext = (expressApp, path, middleware) => {
  expressApp.use(
    path,
    async (req: IncomingMessage & { unchainedContext?: UnchainedAPI }, res, ...rest) => {
      req.unchainedContext = await context({ req, res });
      return middleware(req, res, ...rest);
    },
  );
};
