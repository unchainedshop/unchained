import fs from 'fs';
import path from 'path';
import { UnchainedServerOptions } from '@unchainedshop/types/api.js';
import createGraphQLServer from './createGraphQLServer.js';
import {
  createContextResolver,
  setCurrentContextResolver,
  getCurrentContextResolver,
} from './context.js';

export * from './context.js';
export * as acl from './acl.js';
export * as errors from './errors.js';
export * as express from './express/index.js';
export { hashPassword } from './hashPassword.js';
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

export const startAPIServer = async <GraphQLServerOptions>(
  options: UnchainedServerOptions & GraphQLServerOptions,
) => {
  const { unchainedAPI, roles, context: customContext, adminUiConfig, ...serverOptions } = options || {};

  const contextResolver = createContextResolver(
    unchainedAPI,
    roles,
    UNCHAINED_API_VERSION,
    adminUiConfig,
  );

  setCurrentContextResolver(
    customContext
      ? ({ req, res }) => {
          return customContext({ req, res }, contextResolver);
        }
      : contextResolver,
  );

  return createGraphQLServer(serverOptions);
};
