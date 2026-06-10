import e from 'express';
import cookieParser from 'cookie-parser';
import type { YogaServerInstance } from 'graphql-yoga';
import type { UnchainedCore } from '@unchainedshop/core';
import { pluginRegistry } from '@unchainedshop/core';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getCurrentContextResolver } from '../context.ts';
import { createAuthContext, type AuthContextParams } from '../middleware/createAuthMiddleware.ts';
import type { AuthConfig } from '../auth.ts';
import createMCPMiddleware from './createMCPMiddleware.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import { connectChat } from './chatHandler.ts';
import { mountRoutes } from './mountRoutes.ts';
import { createBackchannelLogoutRoute } from '../handlers/createBackchannelLogoutHandler.ts';
import { generateThemeCSS, type AdminUIThemeConfig } from '@unchainedshop/admin-ui/theme';
import { preparePluginAssets, resolveAdminUIPath, type AdminUIPluginConfig } from '../adminUiPlugins.ts';

export type {
  AdminUIPluginConfig,
  AdminUIPluginEntityConfig,
  AdminUIPluginPageConfig,
  AdminUIPluginTabConfig,
  AdminUIPluginWidgetConfig,
  AdminUIPluginSlotConfig,
} from '../adminUiPlugins.ts';

export type { AdminUIThemeTokens, AdminUIThemeConfig } from '@unchainedshop/admin-ui/theme';

export interface AdminUIRouterOptions {
  prefix?: string;
  enabled?: boolean;
  theme?: AdminUIThemeConfig;
  plugins?: AdminUIPluginConfig[];
}


export const adminUIRouter = (
  enabled = true,
  theme?: AdminUIThemeConfig,
  plugins: AdminUIPluginConfig[] = [],
) => {
  const router = e.Router();

  const adminUIPath = resolveAdminUIPath();
  if (!adminUIPath) return router;

  if (enabled) {
    const themeCSS = generateThemeCSS(theme);
    const themeHash = createHash('sha256').update(themeCSS).digest('hex').slice(0, 8);
    const themeEtag = `"${themeHash}"`;
    router.get('/admin-ui-theme.css', (req, res) => {
      if (req.headers['if-none-match'] === themeEtag) {
        return res.status(304).end();
      }
      res
        .set('Cache-Control', 'public, max-age=0, must-revalidate')
        .set('ETag', themeEtag)
        .type('text/css')
        .send(themeCSS);
    });

    const log = { info: console.info, warn: console.warn };
    const devMode = process.env.NODE_ENV !== 'production';
    const { routes: pluginRoutes, importMapTag } = preparePluginAssets(plugins, log, { devMode });

    for (const [path, asset] of pluginRoutes) {
      router.get(path, (req, res) => {
        if (asset.etag) {
          if (req.headers['if-none-match'] === asset.etag) {
            return res.status(304).end();
          }
          res.set('ETag', asset.etag);
        }
        const body = typeof asset.content === 'function' ? asset.content() : asset.content;
        res.set('Cache-Control', asset.cacheControl).type(asset.contentType).send(body);
      });
    }

    router.use(e.static(adminUIPath));

    if (importMapTag) {
      const injectImportMap = (html: string) => html.replace('</head>', `${importMapTag}</head>`);

      const indexHtml = readFileSync(join(adminUIPath, 'index.html'), 'utf-8');
      const injectedHtml = injectImportMap(indexHtml);

      const extHtmlPath = join(adminUIPath, 'ext', '[[...slug]]', 'index.html');
      const extHtml = existsSync(extHtmlPath)
        ? injectImportMap(readFileSync(extHtmlPath, 'utf-8'))
        : null;

      router.get(/(.*)/, (req, res) => {
        const urlPath = req.path.replace(/\/+$/, '');
        if (extHtml && (urlPath === '/ext' || urlPath.startsWith('/ext/'))) {
          return res.type('text/html').send(extHtml);
        }
        return res.type('text/html').send(injectedHtml);
      });
    } else {
      router.get(/(.*)/, (_, res) => {
        res.sendFile(`${adminUIPath}/index.html`);
      });
    }
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

const { MCP_API_PATH = '/mcp' } = process.env;

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
  const adminUIOptions = typeof adminUI === 'object' ? adminUI : undefined;
  const adminUITheme = adminUIOptions?.theme;
  const adminUIPlugins: AdminUIPluginConfig[] = adminUIOptions?.plugins || [];
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
  expressApp.use(graphqlHandler.graphqlEndpoint, graphqlHandler.handle);

  // MCP endpoint (remains framework-specific due to SDK requirements)
  expressApp.use(MCP_API_PATH, e.json({ limit: '10mb' }));
  expressApp.use(MCP_API_PATH, createMCPMiddleware);

  if (chat) {
    connectChat(expressApp, chat);
  }

  // Collect all routes: plugin routes + backchannel logout (if OIDC configured)
  const routes = pluginRegistry.getRoutes();

  if (authConfig?.oidcProviders?.length) {
    routes.push(createBackchannelLogoutRoute(authConfig.oidcProviders));
  }

  // Mount all routes uniformly
  mountRoutes(expressApp, unchainedAPI, routes);

  if (adminUI) {
    expressApp.use(
      adminUIOptions?.prefix || '/',
      adminUIRouter(true, adminUITheme, adminUIPlugins),
    );
  }
};

export { connectChat };
