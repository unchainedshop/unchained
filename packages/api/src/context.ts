import {
  UnchainedAPI,
  UnchainedHTTPServerContext,
  UnchainedLoaders,
  UnchainedLocaleContext,
  UnchainedUserContext,
} from '@unchainedshop/types/api';
import { WebApp } from 'meteor/webapp';
import { IncomingMessage, OutgoingMessage } from 'http';
import instantiateLoaders from './loaders';
import { getLocaleContext } from './locale-context';
import { getUserContext } from './user-context';

export type UnchainedServerContext = UnchainedLocaleContext &
  UnchainedUserContext &
  UnchainedLoaders &
  UnchainedAPI &
  UnchainedHTTPServerContext;

export type UnchainedContextResolver = (params: {
  req: IncomingMessage;
  res: OutgoingMessage;
}) => Promise<UnchainedServerContext>;

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
      ...loaders,
      ...userContext,
      ...localeContext,
      roles,
      version,
    };
  };

export const useMiddlewareWithCurrentContext = (path, middleware) => {
  WebApp.connectHandlers.use(
    path,
    async (req: IncomingMessage & { unchainedContext?: UnchainedAPI }, res, ...rest) => {
      req.unchainedContext = await context({ req, res });
      return middleware(req, res, ...rest);
    },
  );
};
