import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { ApolloServer } from '@apollo/server';
import type e from 'express';
import { getCurrentContextResolver } from '../context.js';
import createBulkImportMiddleware from './createBulkImportMiddleware.js';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.js';
import createApolloMiddleware from './createApolloMiddleware.js';
import createSingleSignOnMiddleware from './createSingleSignOnMiddleware.js';

const {
  BULK_IMPORT_API_PATH = '/bulk-import',
  ERC_METADATA_API_PATH = '/erc-metadata',
  GRAPHQL_API_PATH = '/graphql',
} = process.env;

const addContext = async function middlewareWithContext(
  req: IncomingMessage & { unchainedContext: UnchainedCore },
  res: OutgoingMessage,
  next,
) {
  try {
    const context = getCurrentContextResolver();
    req.unchainedContext = await context({ req, res });
    next();
  } catch (error) {
    next(error);
  }
};

export const useMiddlewareWithCurrentContext = (expressApp, path, ...middleware) => {
  if (!path) {
    throw new Error('Path is required for useMiddlewareWithCurrentContext');
  }

  expressApp.use(path, addContext, ...middleware);
};

export const connect = (
  expressApp: e.Express,
  { apolloGraphQLServer }: { apolloGraphQLServer: ApolloServer },
  options?: { corsOrigins?: any },
) => {
  expressApp.use(GRAPHQL_API_PATH, createApolloMiddleware(apolloGraphQLServer, options));
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware);
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware);
  expressApp.use(['/', '/.well-known/unchained/cloud-sso'], createSingleSignOnMiddleware);
};
