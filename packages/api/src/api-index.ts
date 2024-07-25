import createGraphQLServer from './createGraphQLServer.js';
import {
  createContextResolver,
  setCurrentContextResolver,
  getCurrentContextResolver,
} from './context.js';
import { YogaServerOptions } from 'graphql-yoga';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { AdminUiConfig } from './types.js';

export * from './context.js';
export * from './types.js';
export * as acl from './acl.js';
export * as errors from './errors.js';
export * as express from './express/index.js';
export * as roles from './roles/index.js';
export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

export type GraphQLServerOptions = YogaServerOptions<any, any> & {
  typeDefs: Array<string>;
  resolvers: Record<string, any>;
};

export type UnchainedServerOptions = {
  roles?: any;
  adminUiConfig?: AdminUiConfig;
};

export const startAPIServer = async (
  options: GraphQLServerOptions &
    UnchainedServerOptions & {
      unchainedAPI: UnchainedCore;
      context?: any;
      events: Array<string>;
      workTypes: Array<string>;
    },
) => {
  const {
    unchainedAPI,
    context: customContext,
    roles,
    adminUiConfig = {},
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

  return createGraphQLServer(serverOptions);
};
