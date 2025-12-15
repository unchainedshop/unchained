import { registerEvents } from '@unchainedshop/events';
import createGraphQLServer, { type GraphQLServerOptions } from './createGraphQLServer.ts';
import {
  createContextResolver,
  setCurrentContextResolver,
  getCurrentContextResolver,
  type AdminUiConfig,
  type UnchainedContextResolver,
} from './context.ts';
import type { UnchainedCore } from '@unchainedshop/core';
import { API_EVENTS } from './events.ts';
export * from './events.ts';
export * from './context.ts';
export * from './locale-context.ts';
export * from './loaders/index.ts';
export * from './errors.ts';
export * as acl from './acl.ts';
export * as roles from './roles/index.ts';
export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

import { buildDefaultTypeDefs } from './schema/index.ts';
import resolvers from './resolvers/index.ts';
import { actions } from './roles/index.ts';

export type UnchainedServerOptions = {
  roles?: any;
  adminUiConfig?: AdminUiConfig;
  unchainedAPI: UnchainedCore;
  context?: (defaultResolver: UnchainedContextResolver) => UnchainedContextResolver;
} & Partial<GraphQLServerOptions>;

export const startAPIServer = async (options: UnchainedServerOptions) => {
  registerEvents(Object.keys(API_EVENTS));

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
