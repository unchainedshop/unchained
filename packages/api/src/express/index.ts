import e from 'express';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import type { YogaServerInstance } from 'graphql-yoga';
import type { UnchainedCore } from '@unchainedshop/core';

import { getCurrentContextResolver } from '../context.ts';
import {
  createAuthContext,
  defaultCookieConfig,
  type AuthMiddlewareConfig,
} from '../middleware/createAuthMiddleware.ts';
import createBulkImportMiddleware from './createBulkImportMiddleware.ts';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.ts';
import createTempUploadMiddleware from './createTempUploadMiddleware.ts';
import createMCPMiddleware from './createMCPMiddleware.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import { connectChat } from './chatHandler.ts';

export interface AdminUIRouterOptions {
  prefix: string;
  enabled?: boolean;
}

export const adminUIRouter = (enabled = true) => {
  const router = e.Router();

  const staticURL = import.meta.resolve('@unchainedshop/admin-ui');
  const staticPath = new URL(staticURL).pathname.split('/').slice(0, -1).join('/');

  if (enabled) {
    router.use(e.static(staticPath));
    router.get(/(.*)/, (_, res) => {
      res.sendFile(`${staticPath}/index.html`);
    });
  }

  return router;
};

const resolveRemoteAddress = (req: e.Request) => ({
  remoteAddress:
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress,
  remotePort: req.socket?.remotePort,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  BULK_IMPORT_API_PATH = '/bulk-import',
  ERC_METADATA_API_PATH = '/erc-metadata',
  TEMP_UPLOAD_API_PATH = '/temp-upload',
  MCP_API_PATH = '/mcp',
  GRAPHQL_API_PATH = '/graphql',
} = process.env;

const createContextMiddleware = (config: AuthMiddlewareConfig) =>
  async function addContext(req: e.Request, res: e.Response, next: e.NextFunction) {
    try {
      const { remoteAddress, remotePort } = resolveRemoteAddress(req);
      const setHeader = (key: string, value: string) => res.setHeader(key, value);
      const getHeader = (key: string) => req.headers[key] as string;

      const authContext = await createAuthContext({
        getHeader,
        setHeader,
        getCookie: (name) => (req as any).cookies?.[name],
        setCookie: (name, value, options) => res.cookie(name, value, options),
        clearCookie: (name, options) => res.clearCookie(name, options),
        remoteAddress,
        remotePort,
        config,
      });

      const contextResolver = getCurrentContextResolver();
      (req as any).unchainedContext = await contextResolver(
        { setHeader, getHeader, remoteAddress, remotePort, ...authContext },
        req,
        res,
      );
      next();
    } catch (error) {
      next(error);
    }
  };

export const connect = (
  expressApp: e.Express,
  {
    graphqlHandler,
    unchainedAPI,
  }: {
    graphqlHandler: YogaServerInstance<any, any>;
    unchainedAPI: UnchainedCore;
  },
  {
    allowRemoteToLocalhostSecureCookies = false,
    adminUI = false,
    chat,
    initPluginMiddlewares,
    authConfig,
  }: {
    allowRemoteToLocalhostSecureCookies?: boolean;
    adminUI?: boolean | Omit<AdminUIRouterOptions, 'enabled'>;
    chat?: ChatConfiguration;
    initPluginMiddlewares?: (app: e.Express, { unchainedAPI }: { unchainedAPI: UnchainedCore }) => void;
    authConfig?: Partial<AuthMiddlewareConfig>;
  } = {},
) => {
  if (allowRemoteToLocalhostSecureCookies) {
    expressApp.set('trust proxy', 1);
    expressApp.use((req, res, next) => {
      req.headers['x-forwarded-proto'] = 'https';
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        req.headers['access-control-request-headers'] || '*',
      );
      next();
    });
  }

  const config: AuthMiddlewareConfig = {
    cookie: defaultCookieConfig,
    ...authConfig,
  };

  expressApp.use(cookieParser());
  expressApp.use(createContextMiddleware(config));

  expressApp.use(GRAPHQL_API_PATH, graphqlHandler.handle);
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware);
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware);
  expressApp.use(TEMP_UPLOAD_API_PATH, upload.any(), createTempUploadMiddleware);
  expressApp.use(MCP_API_PATH, e.json({ limit: '10mb' }));
  expressApp.use(MCP_API_PATH, createMCPMiddleware);

  if (chat) connectChat(expressApp, chat);
  if (initPluginMiddlewares) initPluginMiddlewares(expressApp, { unchainedAPI });
  if (adminUI) {
    expressApp.use(typeof adminUI === 'object' ? adminUI.prefix : '/', adminUIRouter(true));
  }
};

// @deprecated use adminUIRouter instead
export const expressRouter = adminUIRouter;
export { connectChat };
