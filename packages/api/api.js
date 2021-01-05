import { buildLocaleContext } from 'meteor/unchained:core';
import getUserContext from './user-context';
import createGraphQLServer from './createGraphQLServer';
import createBulkImportServer from './createBulkImportServer';
import { configureRoles } from './roles';

export hashPassword from './hashPassword';
export getCart from './getCart';
export evaluateContext from './evaluateContext';
export filterContext from './filterContext';

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

export const createContextResolver = (context, unchained) => async ({
  req,
}) => {
  const unchainedContext = {
    modules: await unchained?.instantiateLoaders(req),
    services: unchained?.services,
  };
  const userContext = await getUserContext(req, unchainedContext);
  const localeContext = await buildLocaleContext(req, unchainedContext);
  const customContext = await context?.(req, unchainedContext);
  return {
    ...userContext,
    ...localeContext,
    ...unchainedContext,
    ...customContext,
  };
};

const startUnchainedServer = (options) => {
  const {
    unchained,
    context = defaultContext,
    rolesOptions,
    ...apolloServerOptions
  } = options || {};

  configureRoles(rolesOptions);

  const apolloGraphQLServer = createGraphQLServer({
    ...apolloServerOptions,
    contextResolver: createContextResolver(context, unchained),
  });

  const bulkImportServer = createBulkImportServer({
    contextResolver: createContextResolver(context, unchained),
  });

  return {
    apolloGraphQLServer,
    bulkImportServer,
  };
};

export default startUnchainedServer;
