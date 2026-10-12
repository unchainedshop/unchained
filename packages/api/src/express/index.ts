import type { Express, Request, RequestHandler, Response } from 'express';
import type { YogaServerInstance } from 'graphql-yoga';
import type { Context } from '../context.ts';
import { createEndpoints, type ConnectOptions } from '../http/createEndpoints.ts';
import { withAuditContext } from '../http/createRequestContext.ts';
import { getNodeHeader, sendWebResponse, toWebRequest } from '../http/nodeHttpBridge.ts';

export type { ConnectOptions } from '../http/createEndpoints.ts';
export type { AdminUIOptions } from '../http/createAdminUIHandler.ts';
export type {
  AdminUIPluginConfig,
  AdminUIPluginEntityConfig,
  AdminUIPluginPageConfig,
  AdminUIPluginTabConfig,
  AdminUIPluginWidgetConfig,
  AdminUIPluginSlotConfig,
  AdminUIThemeTokens,
  AdminUIThemeConfig,
} from '../adminUiPlugins.ts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** The engine's request context: its endpoints and the app's routes after connect() get it */
      unchainedContext?: Context;
    }
  }
}

// The full URL, also when the app is mounted below a path, and a body an app-wide parser read
const webRequest = (req: Request, res: Response) =>
  toWebRequest(req, res, { protocol: req.protocol, path: req.originalUrl, body: req.body });

/**
 * Serves the engine's endpoints as routes of an Express app, after the middleware and routes the
 * app added before. The routes the app adds after connect() get the request context as
 * `req.unchainedContext`.
 */
export const connect = async (
  app: Express,
  platform: { graphqlHandler: YogaServerInstance<any, any> },
  options: ConnectOptions = {},
) => {
  const {
    graphqlHandler: yoga,
    routes,
    serveAdminUI,
    createContext,
    corsHeaders,
  } = createEndpoints(platform, options);

  // The rest of the request runs as the user of its context
  const withContext: RequestHandler = async (req, res, next) => {
    const getHeader = (name: string) => getNodeHeader(req, name);
    if (corsHeaders) res.set(corsHeaders(getHeader));
    const context = await createContext(
      {
        getHeader,
        setHeader: (name, value) => res.setHeader(name, value),
        appendHeader: (name, value) => res.append(name, value),
        remoteAddress: req.socket.remoteAddress,
        remotePort: req.socket.remotePort,
      },
      req,
      res,
    );
    req.unchainedContext = context;
    withAuditContext(context, next);
  };

  // GraphQL Yoga's Express integration: Yoga reads the body unless an app-wide parser did
  app.all(yoga.graphqlEndpoint, withContext, (req, res) => yoga(req, res));

  for (const { path, methods, handler } of routes) {
    const answer: RequestHandler = async (req, res) => {
      const params = req.params as Record<string, string>;
      await sendWebResponse(res, await handler(webRequest(req, res), req.unchainedContext!, params));
    };
    for (const method of methods) app[method.toLowerCase() as 'get'](path, withContext, answer);
  }

  if (serveAdminUI) {
    app.get('/{*path}', async (req, res, next) => {
      // CSP nonce convention of helmet: an earlier middleware sets res.locals.cspNonce
      const response = await serveAdminUI(webRequest(req, res), res.locals.cspNonce);
      if (response) await sendWebResponse(res, response);
      else next();
    });
  }

  app.use(withContext);
};
