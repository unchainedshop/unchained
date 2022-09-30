import { UnchainedServerOptions } from '@unchainedshop/types/api';
import { ApolloServer } from 'apollo-server-express';
import createBulkImportServer from './createBulkImportServer';
import createGraphQLServer from './createGraphQLServer';
import { createContextResolver, getCurrentContextResolver, setCurrentContextResolver } from './context';
import createERCMetadataServer from './createERCMetadataServer';

export * from './context';
export * as acl from './acl';
export * as errors from './errors';
export { hashPassword } from './hashPassword';
export * as roles from './roles';

export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

const UNCHAINED_API_VERSION = '1.2.0'; // eslint-disable-line

export const startAPIServer = (
  options: UnchainedServerOptions,
): {
  apolloGraphQLServer: ApolloServer;
  bulkImportServer: any;
  ercMetadataServer: any;
} => {
  const {
    unchainedAPI,
    roles,
    expressApp,
    context: customContext,
    ...apolloServerOptions
  } = options || {};

  const contextResolver = createContextResolver(unchainedAPI, roles, UNCHAINED_API_VERSION);

  setCurrentContextResolver(
    customContext
      ? ({ req, res }) => {
          return customContext({ req, res }, contextResolver);
        }
      : contextResolver,
  );

  const apolloGraphQLServer = createGraphQLServer(expressApp, apolloServerOptions);
  const bulkImportServer = createBulkImportServer(expressApp);
  const ercMetadataServer = createERCMetadataServer(expressApp);

  return {
    apolloGraphQLServer,
    bulkImportServer,
    ercMetadataServer,
  };
};
