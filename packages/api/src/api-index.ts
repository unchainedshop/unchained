import createGraphQLServer, { GraphQLServerOptions } from './createGraphQLServer.js';
import {
  createContextResolver,
  setCurrentContextResolver,
  getCurrentContextResolver,
} from './context.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { AdminUiConfig } from './types.js';

export * from './context.js';
export * from './types.js';
export * as acl from './acl.js';
export * as errors from './errors.js';
export * as express from './express/index.js';
export * as roles from './roles/index.js';
export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

import { buildDefaultTypeDefs } from './schema/index.js';
import resolvers from './resolvers/index.js';
import { actions } from './roles/index.js';

export type UnchainedServerOptions = {
  roles?: any;
  adminUiConfig?: AdminUiConfig;
  unchainedAPI: UnchainedCore;
  context?: any;
  events: Array<string>;
  workTypes: Array<string>;
} & GraphQLServerOptions;

export const startAPIServer = async (options: UnchainedServerOptions) => {
  const {
    unchainedAPI,
    context: customContext,
    roles,
    adminUiConfig = {},
    events,
    workTypes,
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    ...serverOptions
  } = options || {};

  const contextResolver = createContextResolver(unchainedAPI, { roles, adminUiConfig });

  setCurrentContextResolver(
    customContext
      ? (props) => {
          return customContext(props, contextResolver);
        }
      : contextResolver,
  );

  return createGraphQLServer({
    typeDefs: [
      ...buildDefaultTypeDefs({
        actions: Object.keys(actions),
        events,
        workTypes,
      }),
      ...additionalTypeDefs,
    ],
    resolvers: [resolvers, ...additionalResolvers],
    ...serverOptions,
  });
};
