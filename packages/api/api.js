import { buildLocaleContext } from 'meteor/unchained:core';
import getUserContext from './user-context';
import createGraphQLServer from './createGraphQLServer';
import createBulkImportServer from './createBulkImportServer';
import { configureRoles } from './roles';

export { default as hashPassword } from './hashPassword';
export { default as getCart } from './getCart';
export { default as evaluateContext } from './evaluateContext';
export { default as filterContext } from './filterContext';

export * as roles from './roles';
export * as acl from './acl';
export * as errors from './errors';

global._UnchainedAPIVersion = '0.55.4'; // eslint-disable-line

const defaultContext = (req) => {
  const remoteAddress =
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  return { remoteAddress };
};

export const createContextResolver = (context) => async ({ req }) => {
  const userContext = await getUserContext(req);
  return {
    ...userContext,
    ...buildLocaleContext(req),
    ...context(req),
  };
};

const startUnchainedServer = (options) => {
  const { context = defaultContext, rolesOptions, ...apolloServerOptions } =
    options || {};

  configureRoles(rolesOptions);

  const apolloGraphQLServer = createGraphQLServer({
    ...apolloServerOptions,
    contextResolver: createContextResolver(context),
  });

  const bulkImportServer = createBulkImportServer({
    contextResolver: createContextResolver(context),
  });

  return {
    apolloGraphQLServer,
    bulkImportServer,
  };
};

export default startUnchainedServer;
