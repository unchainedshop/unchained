import type e from 'express';
import { getCurrentContextResolver } from '../context.js';
import createBulkImportMiddleware from './createBulkImportMiddleware.js';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.js';
import createSingleSignOnMiddleware from './createSingleSignOnMiddleware.js';
import cookieParser from 'cookie-parser';
import { YogaServer } from 'graphql-yoga';

const resolveUserRemoteAddress = (req) => {
  const remoteAddress =
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress;

  const remotePort =
    req.connection?.remotePort || req.socket?.remotePort || req.connection?.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const {
  BULK_IMPORT_API_PATH = '/bulk-import',
  ERC_METADATA_API_PATH = '/erc-metadata',
  GRAPHQL_API_PATH = '/graphql',
} = process.env;

const addContext = async function middlewareWithContext(
  req: e.Request & { cookies: any },
  res: e.Response,
  next: e.NextFunction,
) {
  try {
    const setHeader = (key, value) => res.setHeader(key, value);
    const getHeader = (key) => req.headers[key];
    const cookies = req.cookies;
    const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

    const context = getCurrentContextResolver();
    req.unchainedContext = await context({ setHeader, getHeader, cookies, remoteAddress, remotePort });
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
