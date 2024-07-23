import type e from 'express';
import { getCurrentContextResolver } from '../context.js';
import createBulkImportMiddleware from './createBulkImportMiddleware.js';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.js';
import createSingleSignOnMiddleware from './createSingleSignOnMiddleware.js';
import cookieParser from 'cookie-parser';
import { YogaServer } from 'graphql-yoga';
import { Context } from '@unchainedshop/types/api.js';

const {
  BULK_IMPORT_API_PATH = '/bulk-import',
  ERC_METADATA_API_PATH = '/erc-metadata',
  GRAPHQL_API_PATH = '/graphql',
} = process.env;

const addContext = async function middlewareWithContext(
  req: e.Request & { unchainedContext: null | Context },
  res: e.Response,
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

export const connect = (expressApp: e.Express, { yogaServer }: { yogaServer: YogaServer<any, any> }) => {
  expressApp.use(cookieParser(), addContext);
  expressApp.use(GRAPHQL_API_PATH, yogaServer.handle);
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware);
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware);
  expressApp.use(['/', '/.well-known/unchained/cloud-sso'], createSingleSignOnMiddleware);
};
