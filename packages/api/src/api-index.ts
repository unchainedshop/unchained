import fs from 'fs';
import path from 'path';
import { AdminUiConfig } from '@unchainedshop/types/api.js';
import createGraphQLServer from './createGraphQLServer.js';
import {
  createContextResolver,
  setCurrentContextResolver,
  getCurrentContextResolver,
} from './context.js';
import { YogaServerOptions } from 'graphql-yoga';
import { UnchainedCore } from '@unchainedshop/types/core.js';

export * from './context.js';
export * as acl from './acl.js';
export * as errors from './errors.js';
export * as express from './express/index.js';
export * as roles from './roles/index.js';
export { createContextResolver, getCurrentContextResolver, setCurrentContextResolver };

export const loadJSON = (filename) => {
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

const { UNCHAINED_API_VERSION = packageJson?.version || '2.x' } = process.env;

export type GraphQLServerOptions = YogaServerOptions<any, any>;

export type UnchainedServerOptions = GraphQLServerOptions & {
  unchainedAPI: UnchainedCore;
  roles?: any;
  context?: any;
  events: Array<string>;
  workTypes: Array<string>;
  adminUiConfig?: AdminUiConfig;
};

export const startAPIServer = async (options: UnchainedServerOptions) => {
  const { unchainedAPI, roles, context: customContext, adminUiConfig, ...serverOptions } = options || {};

  const contextResolver = createContextResolver(
    unchainedAPI,
    roles,
    UNCHAINED_API_VERSION,
    adminUiConfig,
  );

  setCurrentContextResolver(
    customContext
      ? (props) => {
          return customContext(props, contextResolver);
        }
      : contextResolver,
  );

  return createGraphQLServer(serverOptions);
};
