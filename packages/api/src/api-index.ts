import { UnchainedServerOptions } from '@unchainedshop/types/api';
import createBulkImportServer from './createBulkImportServer';
import createGraphQLServer from './createGraphQLServer';
import { createContextResolver, getCurrentContextResolver, setCurrentContextResolver } from './context';

export * from './context';
export * as acl from './acl';
export * as errors from './errors';
export { hashPassword } from './hashPassword';
export * as roles from './roles';

export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

const UNCHAINED_API_VERSION = '1.0.0-rc.24'; // eslint-disable-line

export const startAPIServer = (options: UnchainedServerOptions) => {
  const { unchainedAPI, roles, context: customContext, ...apolloServerOptions } = options || {};

  const contextResolver = createContextResolver(unchainedAPI, roles, UNCHAINED_API_VERSION);

  setCurrentContextResolver(
    customContext
      ? ({ req, res }) => {
          return customContext({ req, res }, contextResolver);
        }
      : contextResolver,
  );

  const apolloGraphQLServer = createGraphQLServer(apolloServerOptions);
  const bulkImportServer = createBulkImportServer();

  return {
    apolloGraphQLServer,
    bulkImportServer,
  };
};
