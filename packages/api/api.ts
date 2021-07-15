import { withContext } from 'meteor/unchained:utils/context';
import getUserContext, { UnchainedServerUserContext } from './user-context';
import getLocaleContext, {
  UnchainedServerLocaleContext,
} from './locale-context';

import createGraphQLServer from './createGraphQLServer';
import createBulkImportServer from './createBulkImportServer';
import { configureRoles } from './roles';

import hashPassword from './hashPassword';
import getCart from './getCart';
import instantiateLoaders, { UnchainedServerLoaders } from './loaders';

export { hashPassword, getCart };
export * as roles from './roles';
export * as acl from './acl';
export * as errors from './errors';

export interface UnchainedAPI {
  version: string;
}

export type UnchainedServerContext = UnchainedServerLocaleContext &
  UnchainedServerUserContext &
  UnchainedServerLoaders &
  UnchainedAPI;

export interface UnchainedServerOptions {
  unchained: UnchainedAPI;
  bulkImporter: any;
  rolesOptions: any;
  context: any;
}

const UNCHAINED_API_VERSION = '1.0.0-beta8'; // eslint-disable-line

export const createContextResolver =
  (unchained: UnchainedAPI) =>
  async (apolloContext): Promise<UnchainedServerContext> => {
    const loaders = await instantiateLoaders(apolloContext.req, unchained);
    // const intermediateContext: Partial<UnchainedServerContext> = {
    //   ...unchained,
    //   ...loaders,
    // };
    const userContext = await getUserContext(
      apolloContext.req /* intermediateContext */
    );
    const localeContext = await getLocaleContext(apolloContext.req);
    return {
      ...apolloContext,
      ...unchained,
      ...loaders,
      ...userContext,
      ...localeContext,
      version: UNCHAINED_API_VERSION,
    };
  };

let context;

const startUnchainedServer = (options: UnchainedServerOptions) => {
  const {
    unchained,
    rolesOptions,
    context: customContext,
    ...apolloServerOptions
  } = options || {};

  configureRoles(rolesOptions);

  const contextResolver = createContextResolver(unchained);

  context = customContext
    ? ({ req, res }) => {
        return customContext({ req, res, unchainedContextFn: contextResolver });
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

export const getCurrentContextResolver = () => context;

export const useMiddlewareWithCurrentContext = (path, middleware) => {
  WebApp.connectHandlers.use(
    path,
    withContext((req, res, ...rest) =>
      getCurrentContextResolver()(req, res, ...rest)
    )(middleware)
  );
};

export default startUnchainedServer;
