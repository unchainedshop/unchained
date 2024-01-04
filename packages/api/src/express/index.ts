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

export const useMiddlewareWithCurrentContext = (expressApp, path, ...middleware) => {
  const context = getCurrentContextResolver();
  const addContext = async function middlewareWithContext(
    req: IncomingMessage & { unchainedContext: UnchainedCore },
    res: OutgoingMessage,
    next,
  ) {
    try {
      req.unchainedContext = await context({ req, res });
      next();
    } catch (error) {
      next(error);
    }
  };

  expressApp.use(path, addContext, ...middleware);
};

export const connect = (
  expressApp: e.Express,
  { apolloGraphQLServer }: { apolloGraphQLServer: ApolloServer },
  options?: { corsOrigins?: any },
) => {
  const contextResolver = getCurrentContextResolver();

  expressApp.use(
    GRAPHQL_API_PATH,
    createApolloMiddleware(contextResolver, apolloGraphQLServer, options),
  );
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware(contextResolver));
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware(contextResolver));
  expressApp.use(
    ['/', '/.well-known/unchained/cloud-sso'],
    createSingleSignOnMiddleware(contextResolver),
  );
};
