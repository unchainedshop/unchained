import type { Express, RequestHandler } from 'express';
import { Readable } from 'node:stream';
import type { PluginHttpRoute, UnchainedCore } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import { executePluginRoute } from '../http/executePluginRoute.ts';
import { sendWebResponse, toWebRequest } from '../http/nodeHttpBridge.ts';

const logger = createLogger('unchained:api:express-routes');

export function mountRoutes(
  app: Express,
  unchainedCore: UnchainedCore,
  routes: PluginHttpRoute[],
): void {
  if (routes.length === 0) return;

  const endpoints = routes.map((route) => `${route.method} ${route.path}`).join(', ');
  logger.info(`Mounting ${routes.length} route(s): ${endpoints}`);

  for (const route of routes) {
    const handler: RequestHandler = async (request, response) => {
      try {
        const parsedBody = (request as any).body;
        const body =
          parsedBody === undefined ||
          typeof parsedBody === 'string' ||
          parsedBody instanceof Uint8Array ||
          parsedBody instanceof Readable
            ? parsedBody
            : JSON.stringify(parsedBody);
        const webResponse = await executePluginRoute({
          route,
          request: toWebRequest(request, response, body),
          unchainedCore,
          requestContext: (request as any).unchainedContext,
          params: request.params as Record<string, string>,
          auditContext: (request as any)._auditContext,
        });
        await sendWebResponse(response, webResponse);
      } catch (error) {
        logger.error(`Error handling request for ${route.method} ${route.path}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (!response.headersSent) {
          response.status(500).json({ error: 'Internal Server Error' });
        } else {
          response.destroy();
        }
      }
    };

    const method = route.method.toLowerCase();
    if (method === 'all') {
      app.use(route.path, handler);
    } else {
      (app as any)[method](route.path, handler);
    }
  }
}
