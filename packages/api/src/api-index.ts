import {
  UnchainedAPI,
  UnchainedHTTPServerContext,
  UnchainedLoaders,
  UnchainedLocaleContext,
  UnchainedServerOptions,
  UnchainedUserContext,
} from '@unchainedshop/types/api';
import { IncomingMessage, OutgoingMessage } from 'http';
import { WebApp } from 'meteor/webapp';
import createBulkImportServer from './createBulkImportServer';
import createGraphQLServer from './createGraphQLServer';
import instantiateLoaders from './loaders';
import { getLocaleContext } from './locale-context';
import { configureRoles } from './roles';
import { getUserContext } from './user-context';

export * as acl from './acl';
export * as errors from './errors';
export { hashPassword } from './hashPassword';
export * as roles from './roles';

export type UnchainedServerContext = UnchainedLocaleContext &
  UnchainedUserContext &
  UnchainedLoaders &
  UnchainedAPI &
  UnchainedHTTPServerContext;

export type UnchainedContextResolver = (params: {
  req: IncomingMessage;
  res: OutgoingMessage;
}) => Promise<UnchainedServerContext>;

const UNCHAINED_API_VERSION = '1.0.0-rc.12'; // eslint-disable-line

const createContextResolver =
  (unchainedAPI: UnchainedAPI): UnchainedContextResolver =>
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
      version: UNCHAINED_API_VERSION,
    };
  };

let context;

export const startAPIServer = (options: UnchainedServerOptions) => {
  const {
    unchainedAPI,
    rolesOptions = {},
    context: customContext,
    ...apolloServerOptions
  } = options || {};

  configureRoles(rolesOptions);

  const contextResolver = createContextResolver(unchainedAPI);

  context = customContext
    ? ({ req, res }) => {
        return customContext({ req, res }, contextResolver);
      }
    : contextResolver;

  const apolloGraphQLServer = createGraphQLServer({
    ...apolloServerOptions,
    context,
  });

  const bulkImportServer = createBulkImportServer({
    context,
  });

  return {
    apolloGraphQLServer,
    bulkImportServer,
  };
};

const getCurrentContextResolver = (): UnchainedContextResolver => context;

export const useMiddlewareWithCurrentContext = (path, middleware) => {
  WebApp.connectHandlers.use(
    path,
    async (req: IncomingMessage & { unchainedContext?: UnchainedAPI }, res, ...rest) => {
      const currentContextResolver = getCurrentContextResolver();
      req.unchainedContext = await currentContextResolver({ req, res });
      return middleware(req, res, ...rest);
    },
  );
};
