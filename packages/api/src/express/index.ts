import e from 'express';
import cookieParser from 'cookie-parser';
import type { YogaServerInstance } from 'graphql-yoga';
import type { UnchainedCore } from '@unchainedshop/core';

import { getCurrentContextResolver } from '../context.ts';
import { createAuthContext, type AuthContextParams } from '../middleware/createAuthMiddleware.ts';
import type { AuthConfig } from '../auth.ts';
import createMCPMiddleware from './createMCPMiddleware.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import { connectChat } from './chatHandler.ts';
import { mountPluginRoutes } from './mountPluginRoutes.ts';
import { createBackchannelLogoutHandler } from '../handlers/createBackchannelLogoutHandler.ts';

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

/**
 * Resolve the user's remote address
 * SECURITY: Proxy headers (x-forwarded-for, x-real-ip) can be spoofed unless:
 * - The application is behind a properly configured reverse proxy
 * - The proxy strips/validates these headers from untrusted sources
 * When trustProxy is false, we only use the socket's remote address
 */
const resolveUserRemoteAddress = (req: e.Request, trustProxy = false) => {
  let remoteAddress: string | undefined;

  if (trustProxy) {
    // Only trust proxy headers when explicitly enabled
    // Per RFC 7239: use the LAST IP in X-Forwarded-For as it's the one added by our trusted proxy
    // Earlier IPs in the chain can be spoofed by malicious clients
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    const forwardedIps = forwardedFor?.split(',').map((ip) => ip.trim());
    remoteAddress =
      (req.headers['x-real-ip'] as string) ||
      forwardedIps?.[forwardedIps.length - 1] ||
      req.socket?.remoteAddress;
  } else {
    // Default: only use socket address (cannot be spoofed)
    remoteAddress = req.socket?.remoteAddress;
  }

  const remotePort = req.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const { MCP_API_PATH = '/mcp', GRAPHQL_API_PATH = '/graphql' } = process.env;

const createAddContextMiddleware = (authConfig?: AuthConfig, trustProxy = false) =>
  async function middlewareWithContext(req: e.Request, res: e.Response, next: e.NextFunction) {
    try {
      const setHeader = (key: string, value: string) => res.setHeader(key, value);
      const getHeader = (key: string) => req.headers[key] as string;
      const getCookie = (name: string) => (req as any).cookies?.[name];
      const setCookie = (name: string, value: string, options: any) => res.cookie(name, value, options);
      const clearCookie = (name: string, options: any) =>
        res.clearCookie(name, { ...options, maxAge: 0 });
      const { remoteAddress, remotePort } = resolveUserRemoteAddress(req, trustProxy);

      const authContextParams: AuthContextParams = {
        setHeader,
        getHeader,
        getCookie,
        setCookie,
        clearCookie,
        remoteAddress,
        remotePort,
      };

      // Create auth context (handles JWT verification and login/logout functions)
      const authContext = await createAuthContext(authContextParams, authConfig);

      // Get the context resolver
      const context = getCurrentContextResolver();

      // Build full context
      (req as any).unchainedContext = await context(
        {
          setHeader,
          getHeader,
          remoteAddress,
          remotePort,
          login: authContext.login,
          logout: authContext.logout,
          accessToken: authContext.accessToken,
          userId: authContext.userId,
          impersonatorId: authContext.impersonatorId,
          tokenVersion: authContext.tokenVersion,
        },
        req,
        res,
      );
      next();
    } catch (error) {
      next(error);
    }
  };

export const connect = async (
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
    authConfig,
    trustProxy = false,
  }: {
    allowRemoteToLocalhostSecureCookies?: boolean;
    adminUI?: boolean | Omit<AdminUIRouterOptions, 'enabled'>;
    chat?: ChatConfiguration;
    authConfig?: AuthConfig;
    /** SECURITY: Enable this ONLY if behind a properly configured reverse proxy
     * that strips/validates x-forwarded-for and x-real-ip headers from untrusted sources */
    trustProxy?: boolean;
  } = {},
) => {
  if (allowRemoteToLocalhostSecureCookies) {
    // SECURITY: This mode is for development only - block in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'allowRemoteToLocalhostSecureCookies is not allowed in production. ' +
          'Configure a proper CORS policy with specific allowed origins instead.',
      );
    }

    // Workaround: Allow to use sandbox with localhost (development only)
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

  // Use cookie-parser for JWT cookie handling
  expressApp.use(cookieParser());

  // Add auth context middleware
  // Note: allowRemoteToLocalhostSecureCookies implies trustProxy for dev convenience
  expressApp.use(
    createAddContextMiddleware(authConfig, trustProxy || allowRemoteToLocalhostSecureCookies),
  );

  // GraphQL endpoint
  expressApp.use(GRAPHQL_API_PATH, graphqlHandler.handle);

  // MCP endpoint (remains framework-specific due to SDK requirements)
  expressApp.use(MCP_API_PATH, e.json({ limit: '10mb' }));
  expressApp.use(MCP_API_PATH, createMCPMiddleware);

  if (chat) {
    connectChat(expressApp, chat);
  }

  // Mount plugin routes automatically
  mountPluginRoutes(expressApp, unchainedAPI);

  // Mount OIDC back-channel logout endpoint if providers are configured
  if (authConfig?.oidcProviders?.length) {
    const backchannelHandler = createBackchannelLogoutHandler(unchainedAPI, authConfig.oidcProviders);
    expressApp.post('/backchannel-logout', e.urlencoded({ extended: false }), async (req, res) => {
      await backchannelHandler.handleNodeRequestAndResponse(req, res, {
        unchainedAPI,
        providers: authConfig.oidcProviders!,
      });
    });
  }

  if (adminUI) {
    expressApp.use(typeof adminUI === 'object' ? adminUI.prefix : '/', adminUIRouter(true));
  }
};

export { connectChat };
