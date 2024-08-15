import fs from 'fs';
import path from 'path';
import { UnchainedCore } from '@unchainedshop/core';
import instantiateLoaders from './loaders/index.js';
import { getLocaleContext } from './locale-context.js';
import { UnchainedServerOptions } from './api-index.js';
import { Context, UnchainedHTTPServerContext } from './types.js';

let context;

export const getCurrentContextResolver = (): UnchainedContextResolver => context;

export const setCurrentContextResolver = (newContext: UnchainedContextResolver) => {
  context = newContext;
};

export type UnchainedContextResolver = (
  params: UnchainedHTTPServerContext & {
    remoteAddress?: string;
    remotePort?: number;
    user?: any;
    userId?: string;
    login: (user: any) => Promise<{ _id: string; user: any; tokenExpires: Date }>;
    logout: () => Promise<boolean>;
  },
) => Promise<Context>;

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
  } catch {
    return null;
  }
};

const packageJson = loadJSON('../package.json');

const { UNCHAINED_API_VERSION = packageJson?.version || '2.x' } = process.env;

export const createContextResolver =
  (
    unchainedAPI: UnchainedCore,
    unchainedConfig: Pick<UnchainedServerOptions, 'roles' | 'adminUiConfig'>,
  ): UnchainedContextResolver =>
  async ({ getHeader, setHeader, remoteAddress, remotePort, user, userId, login, logout }) => {
    const abstractHttpServerContext = { remoteAddress, remotePort, getHeader, setHeader };
    const loaders = await instantiateLoaders(unchainedAPI);
    const localeContext = await getLocaleContext(abstractHttpServerContext, unchainedAPI);
    const userContext = { user, userId, login, logout };

    return {
      ...unchainedAPI,
      ...unchainedConfig,
      ...localeContext,
      ...userContext,
      loaders,
      version: UNCHAINED_API_VERSION,
      setHeader,
      getHeader,
    };
  };
