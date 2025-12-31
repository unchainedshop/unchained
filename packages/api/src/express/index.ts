// TODO: Consider creating shared handler abstractions with fastify adapter
// to reduce code duplication for bulk import, file upload, webhooks, and chat handlers.
// See packages/api/src/fastify/index.ts for the parallel implementation.
import e from 'express';
import session from 'express-session';
import multer from 'multer';
import DrizzleStore from '../drizzle-store.ts';
import { Passport } from 'passport';
import type { YogaServerInstance } from 'graphql-yoga';
import type { UnchainedCore } from '@unchainedshop/core';
import { emit } from '@unchainedshop/events';
import type { User } from '@unchainedshop/core-users';

import { getCurrentContextResolver, type LoginFn, type LogoutFn } from '../context.ts';
import createBulkImportMiddleware from './createBulkImportMiddleware.ts';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.ts';
import createTempUploadMiddleware from './createTempUploadMiddleware.ts';
import createMCPMiddleware from './createMCPMiddleware.ts';
import { API_EVENTS } from '../events.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import { connectChat } from './chatHandler.ts';
import type { CipherKey } from 'node:crypto';
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

const resolveUserRemoteAddress = (req: e.Request) => {
  const remoteAddress =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress;

  const remotePort = req.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  BULK_IMPORT_API_PATH = '/bulk-import',
  ERC_METADATA_API_PATH = '/erc-metadata',
  TEMP_UPLOAD_API_PATH = '/temp-upload',
  MCP_API_PATH = '/mcp',
  GRAPHQL_API_PATH = '/graphql',
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  UNCHAINED_COOKIE_SAMESITE = 'none',
  UNCHAINED_COOKIE_INSECURE,
} = process.env;

const addContext = async function middlewareWithContext(
  req: e.Request,
  res: e.Response,
  next: e.NextFunction,
) {
  try {
    const setHeader = (key, value) => res.setHeader(key, value);
    const getHeader = (key) => req.headers[key] as string;
    const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

    const context = getCurrentContextResolver();

    const login: LoginFn = async (user: User, options = {}) => {
      const { impersonator } = options;

      await new Promise((resolve, reject) => {
        (req as any).login(user, (error, result) => {
          if (error) {
            return reject(error);
          }
          (req as any).session.impersonatorId = impersonator?._id;
          return resolve(result);
        });
      });

      const tokenObject = {
        _id: (req as any).sessionID,
        userId: user._id,

        tokenExpires: new Date((req as any).session?.cookie._expires),
      };

      await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, tokenObject);

      (user as any)._inLoginMethodResponse = true;
      return { user, ...tokenObject };
    };

    const logout: LogoutFn = async (sessionId) => {
      const { user } = req as any;
      if (!user) return false;

      const currentSessionId = (req as any).sessionID;
      const targetSessionId = sessionId || currentSessionId;

      const tokenObject = {
        _id: targetSessionId,
        userId: user._id,
      };

      // If a specific sessionId is provided and it's different from current session,
      // destroy only that session from the store without affecting current session
      if (sessionId && sessionId !== currentSessionId) {
        // Destroy the specific session from the store
        await new Promise<void>((resolve, reject) => {
          (req as any).sessionStore.destroy(sessionId, (error: Error | null) => {
            if (error) {
              return reject(error);
            }
            return resolve();
          });
        });
      } else {
        // Logout current session (passport logout + clear impersonator)
        await new Promise((resolve, reject) => {
          (req as any).logout((error: Error | null, result: any) => {
            if (error) {
              return reject(error);
            }
            (req as any).session.impersonatorId = null;
            return resolve(result);
          });
        });
      }

      await emit(API_EVENTS.API_LOGOUT, tokenObject);
      return true;
    };

    const [, accessToken] = req.headers.authorization?.split(' ') || [];

    (req as any).unchainedContext = await context(
      {
        setHeader,
        getHeader,
        remoteAddress,
        remotePort,
        login,
        logout,
        accessToken,
        userId: (req as any).user?._id,
        impersonatorId: (req as any).session.impersonatorId,
      },
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
  }: {
    allowRemoteToLocalhostSecureCookies?: boolean;
    adminUI?: boolean | Omit<AdminUIRouterOptions, 'enabled'>;
    chat?: ChatConfiguration;
    initPluginMiddlewares?: (app: e.Express, { unchainedAPI }: { unchainedAPI: UnchainedCore }) => void;
  } = {},
) => {
  if (allowRemoteToLocalhostSecureCookies) {
    // Workaround: Allow to use sandbox with localhost
    expressApp.set('trust proxy', 1);
    expressApp.use((req, res, next) => {
      req.headers['x-forwarded-proto'] = 'https';
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Methods',
        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].join(', '),
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        req.headers['access-control-request-headers'] || '*',
      );
      next();
    });
  }
  const passport = new Passport();

  passport.serializeUser(function serialize(user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(function deserialize(_id, done) {
    done(null, { _id });
  });

  const name = UNCHAINED_COOKIE_NAME;
  const domain = UNCHAINED_COOKIE_DOMAIN;
  const path = UNCHAINED_COOKIE_PATH;
  const secure = UNCHAINED_COOKIE_INSECURE ? false : true;
  const sameSite = ({
    none: 'none',
    lax: 'lax',
    strict: 'strict',
    '1': true,
    '0': false,
  }[UNCHAINED_COOKIE_SAMESITE?.trim()?.toLowerCase()] || false) as boolean | 'none' | 'lax' | 'strict';

  expressApp.use(
    session({
      secret: process.env.UNCHAINED_TOKEN_SECRET as CipherKey,
      store: DrizzleStore.create({
        db: unchainedAPI.db,
        touchAfter: 24 * 3600 /* 24 hours */,
      }),
      name,
      saveUninitialized: false,
      resave: false,
      cookie: {
        domain,
        path,
        sameSite,
        secure,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
    passport.initialize(),
    passport.session(),
    addContext,
  );
  expressApp.use(GRAPHQL_API_PATH, graphqlHandler.handle);
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware);
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware);
  expressApp.use(TEMP_UPLOAD_API_PATH, upload.any(), createTempUploadMiddleware);

  expressApp.use(MCP_API_PATH, e.json({ limit: '10mb' }));
  expressApp.use(MCP_API_PATH, createMCPMiddleware);

  if (chat) {
    connectChat(expressApp, chat);
  }

  if (initPluginMiddlewares) {
    initPluginMiddlewares(expressApp, { unchainedAPI });
  }

  if (adminUI) {
    expressApp.use(typeof adminUI === 'object' ? adminUI.prefix : '/', adminUIRouter(true));
  }
};

// @deprecated use adminUIRouter instead
export const expressRouter = adminUIRouter;

export { connectChat };
