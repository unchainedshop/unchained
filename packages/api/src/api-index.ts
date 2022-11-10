import { UnchainedServerOptions } from '@unchainedshop/types/api';
import { ApolloServer } from 'apollo-server-express';
import fs from 'fs';
import path from 'path';
import createBulkImportServer from './createBulkImportServer';
import createGraphQLServer from './createGraphQLServer';
import { createContextResolver, getCurrentContextResolver, setCurrentContextResolver } from './context';

export * from './context';
export * as acl from './acl';
export * as errors from './errors';
export { hashPassword } from './hashPassword';
export * as roles from './roles';
export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

const loadJSON = (filename) => {
  try {
    const base = typeof __filename !== 'undefined' && __filename;
    if (!base)
      return {
        version: process.env.npm_package_version,
      };
    const absolutePath = path.resolve(path.dirname(base), filename);
    const data = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
    return data;
  } catch (e) {
    return null;
  }
};
const packageJson = loadJSON('../package.json');

const UNCHAINED_API_VERSION = process.env.UNCHAINED_API_VERSION || packageJson?.version || '1.2.x';

export const startAPIServer = (
  options: UnchainedServerOptions,
): {
  apolloGraphQLServer: ApolloServer;
  bulkImportServer: any;
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

  return {
    apolloGraphQLServer,
    bulkImportServer,
  };
};
