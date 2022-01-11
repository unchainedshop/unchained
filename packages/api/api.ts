import { getUserContext } from './user-context';
import { getLocaleContext } from './locale-context';

import createGraphQLServer from './createGraphQLServer';
import createBulkImportServer from './createBulkImportServer';
import { configureRoles } from './roles';

// import getCart from './getCart';
import instantiateLoaders from './loaders';
import {
  UnchainedAPI,
  UnchainedLoaders,
  UnchainedLocaleContext,
  UnchainedUserContext,
} from '@unchainedshop/types/api';

export { hashPassword } from './hashPassword';
export * as roles from './roles';
export * as acl from './acl';
export * as errors from './errors';

export type UnchainedServerContext = UnchainedLocaleContext &
  UnchainedUserContext &
  UnchainedLoaders &
  UnchainedAPI;

export interface UnchainedServerOptions {
  unchainedAPI: UnchainedAPI;
  bulkImporter: any;
  rolesOptions: any;
  context: any;
}

const UNCHAINED_API_VERSION = '1.0.0-beta15'; // eslint-disable-line

export const createContextResolver =
  (unchainedAPI: UnchainedAPI) =>
  // eslint-disable-next-line
  async ({ req, res, ...apolloContext }): Promise<UnchainedServerContext> => {
    const loaders = await instantiateLoaders(req, unchainedAPI);
    // const intermediateContext: Partial<UnchainedServerContext> = {
    //   ...unchained,
    //   ...loaders,
    // };

    const userContext = await getUserContext(req, unchainedAPI);
    const localeContext = await getLocaleContext(req, unchainedAPI);

    return {
      ...apolloContext,
      ...unchainedAPI,
      ...loaders,
      ...userContext,
      ...localeContext,
      version: UNCHAINED_API_VERSION,
    };
  };

let context;

const startUnchainedServer = (options: UnchainedServerOptions) => {
  const {
    unchainedAPI,
    rolesOptions,
    context: customContext,
    ...apolloServerOptions
  } = options || {};

  configureRoles(rolesOptions);

  const contextResolver = createContextResolver(unchainedAPI);

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

const getCurrentContextResolver = () => context;

export const useMiddlewareWithCurrentContext = (path, middleware) => {
  /* @ts-ignore */
  WebApp.connectHandlers.use(path, async (req, res, ...rest) => {
    const currentContextResolver = getCurrentContextResolver();
    req.unchainedContext = await currentContextResolver({ req, res });
    return middleware(req, res, ...rest);
  });
};

export default startUnchainedServer;
