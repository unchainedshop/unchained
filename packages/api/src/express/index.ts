import type { Express, Request, RequestHandler, Response } from 'express';
import type { YogaServerInstance } from 'graphql-yoga';
import { createLogger } from '@unchainedshop/logger';
import type { Context } from '../context.ts';
import { createEndpoints, internalServerError, type ConnectOptions } from '../http/createEndpoints.ts';
import { withAuditContext } from '../http/createRequestContext.ts';
import { getNodeHeader, sendWebResponse, toWebRequest } from '../http/nodeHttpBridge.ts';

const logger = createLogger('unchained:api:express');

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
      unchainedContext?: Context;
    }
  }
}

const routesGivenParsedBodies = new Set<string>();

const webRequest = (req: Request, res: Response) => {
  const { rawBody } = req as { rawBody?: unknown };
  const route = req.route?.path ?? req.path;
  if (req.body !== undefined && rawBody === undefined && !routesGivenParsedBodies.has(route)) {
    routesGivenParsedBodies.add(route);
    logger.warn(
      `${req.method} ${route} gets the body of an app-wide body parser re-serialized, so webhook ` +
        'signatures fail: add body parsers after connect() or keep req.rawBody',
    );
  }
  return toWebRequest(req, res, {
    protocol: req.protocol,
    path: req.originalUrl,
    body: rawBody ?? req.body,
  });
};

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

  const withContext: RequestHandler = async (req, res, next) => {
    const getHeader = (name: string) => getNodeHeader(req, name);
    if (corsHeaders) res.set(corsHeaders(getHeader));
    try {
      req.unchainedContext = await createContext(
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
    } catch (error) {
      await sendWebResponse(res, internalServerError(req.method, req.originalUrl, error));
      return;
    }
    withAuditContext(req.unchainedContext, next);
  };

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
      const response = await serveAdminUI(webRequest(req, res), res.locals.cspNonce);
      if (response) await sendWebResponse(res, response);
      else next();
    });
  }

  app.use(withContext);
};
