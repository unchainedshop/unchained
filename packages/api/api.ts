import getUserContext, { UnchainedServerUserContext } from './user-context';
import getLocaleContext, {
  UnchainedServerLocaleContext,
} from './locale-context';

import createGraphQLServer from './createGraphQLServer';
import createBulkImportServer from './createBulkImportServer';
import { configureRoles } from './roles';

import hashPassword from './hashPassword';
import getCart from './getCart';
import evaluateContext from './evaluateContext';
import filterContext from './filterContext';
import instantiateLoaders, { UnchainedServerLoaders } from './loaders';

export { hashPassword, getCart, evaluateContext, filterContext };
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
  rolesOptions: any;
}

const UNCHAINED_API_VERSION = '0.55.4'; // eslint-disable-line

export const createContextResolver = (unchained: UnchainedAPI) => async ({
  req,
}): Promise<UnchainedServerContext> => {
  const loaders = await instantiateLoaders(req, unchained);
  // const intermediateContext: Partial<UnchainedServerContext> = {
  //   ...unchained,
  //   ...loaders,
  // };
  const userContext = await getUserContext(req /* intermediateContext */);
  const localeContext = await getLocaleContext(req);
  return {
    ...unchained,
    ...loaders,
    ...userContext,
    ...localeContext,
    version: UNCHAINED_API_VERSION,
  };
};

const startUnchainedServer = (options: UnchainedServerOptions) => {
  const { unchained, rolesOptions, ...apolloServerOptions } = options || {};

  configureRoles(rolesOptions);

  const apolloGraphQLServer = createGraphQLServer({
    ...apolloServerOptions,
    contextResolver: createContextResolver(unchained),
  });

  const bulkImportServer = createBulkImportServer({
    contextResolver: createContextResolver(unchained),
  });

  return {
    apolloGraphQLServer,
    bulkImportServer,
  };
};

export default startUnchainedServer;
