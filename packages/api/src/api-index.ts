import createGraphQLServer, { GraphQLServerOptions } from './createGraphQLServer.js';
import {
  createContextResolver,
  setCurrentContextResolver,
  getCurrentContextResolver,
  AdminUiConfig,
  UnchainedContextResolver,
} from './context.js';
import { UnchainedCore } from '@unchainedshop/core';
export * from './events.js';
export * from './context.js';
export * from './locale-context.js';
export * from './loaders/index.js';
export * from './errors.js';
export * as acl from './acl.js';
export * as roles from './roles/index.js';
export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

import { buildDefaultTypeDefs } from './schema/index.js';
import resolvers from './resolvers/index.js';
import { actions } from './roles/index.js';

export type UnchainedServerOptions = {
  roles?: any;
  adminUiConfig?: AdminUiConfig;
  unchainedAPI: UnchainedCore;
  context?: (defaultResolver: UnchainedContextResolver) => UnchainedContextResolver;
} & Partial<GraphQLServerOptions>;

export const startAPIServer = async (options: UnchainedServerOptions) => {
  const {
    unchainedAPI,
    context: customContext,
    roles,
    adminUiConfig = {},
    ...serverOptions
  } = options as UnchainedServerOptions;

  const contextResolver = createContextResolver(unchainedAPI, {
    roles,
    adminUiConfig,
  });

  setCurrentContextResolver(
    customContext
      ? (props, ...rest) => {
          return customContext(contextResolver)(props, ...rest);
        }
      : contextResolver,
  );

  const additionalTypeDefs = 'typeDefs' in serverOptions ? serverOptions.typeDefs : [];
  const additionalResolvers = 'resolvers' in serverOptions ? serverOptions.resolvers : [];

  return createGraphQLServer({
    ...serverOptions,
    typeDefs: [
      ...buildDefaultTypeDefs({
        actions: Object.keys(actions),
      }),
      ...(additionalTypeDefs || []),
    ],
    resolvers: [resolvers, ...(additionalResolvers || [])],
  });
};
