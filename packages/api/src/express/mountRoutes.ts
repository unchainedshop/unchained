import type { Express, RequestHandler } from 'express';
import type { UnchainedCore, PluginHttpRoute } from '@unchainedshop/core';
import { createServerAdapter } from '@whatwg-node/server';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('express');

// Extended context type for our server adapter
interface PluginServerContext {
  unchainedContext?: any;
  params?: Record<string, string>;
  rawRequest?: any; // Raw Node.js IncomingMessage for direct stream access
}

/**
 * Mount HTTP routes on Express
 *
 * Uses @whatwg-node/server to create a framework-agnostic adapter
 * that converts Express requests to WHATWG Request and Response back to Express
 *
 * @param app Express application instance
 * @param unchainedAPI Unchained core API
 * @param routes Array of routes to mount
 */
export function mountRoutes(app: Express, unchainedAPI: UnchainedCore, routes: PluginHttpRoute[]): void {
  if (routes.length === 0) return;

  const endpoints = routes.map((r) => `${r.method} ${r.path}`).join(', ');
  logger.info(`Mounting ${routes.length} route(s): ${endpoints}`);

  for (const route of routes) {
    // Create WHATWG-compliant server adapter
    // This handles Express → WHATWG Request → handler → WHATWG Response → Express
    const adapter = createServerAdapter<PluginServerContext>(async (request: Request, serverContext) => {
      // Build plugin context from server context and unchainedAPI
      const context = {
        ...unchainedAPI,
        ...serverContext.unchainedContext,
        params: serverContext.params || {},
        rawRequest: serverContext.rawRequest, // Pass through raw Node.js request
      };

      try {
        // Call the plugin handler with WHATWG Request and context
        return await route.handler(request, context);
      } catch (error) {
        logger.error(`Error in route handler ${route.method} ${route.path}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Return error response
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Internal Server Error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    });

    // Mount the adapter on Express
    const method = route.method.toLowerCase();

    const expressHandler: RequestHandler = async (req, res) => {
      try {
        // Use handleNodeRequestAndResponse - properly converts Node.js IncomingMessage to WHATWG Request
        // and automatically sends the response
        await adapter.handleNodeRequestAndResponse(req, res, {
          unchainedContext: (req as any).unchainedContext,
          params: req.params as Record<string, string>,
          rawRequest: req,
        } as PluginServerContext);
      } catch (error) {
        logger.error(`Error handling request for ${route.method} ${route.path}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
    };

    if (method === 'all') {
      app.use(route.path, expressHandler);
    } else {
      (app as any)[method](route.path, expressHandler);
    }
  }
}
