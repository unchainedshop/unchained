import type { FastifyInstance } from 'fastify';
import type { UnchainedCore } from '@unchainedshop/core';
import { pluginRegistry } from '@unchainedshop/core';
import { createServerAdapter } from '@whatwg-node/server';

// Extended context type for our server adapter
interface PluginServerContext {
  unchainedContext?: any;
  params?: Record<string, string>;
  rawRequest?: any; // Raw Node.js IncomingMessage for direct stream access
}

/**
 * Mount plugin routes on Fastify
 *
 * Uses @whatwg-node/server to create a framework-agnostic adapter
 * that converts Fastify requests to WHATWG Request and Response back to Fastify
 *
 * @param fastify Fastify instance
 * @param unchainedAPI Unchained core API
 */
export function mountPluginRoutes(fastify: FastifyInstance, unchainedAPI: UnchainedCore): void {
  const routes = pluginRegistry.getRoutes();

  if (routes.length === 0) return;

  const endpoints = routes.map((r) => `${r.method} ${r.path}`).join(', ');
  fastify.log.info(`Mounting ${routes.length} plugin route(s): ${endpoints}`);

  // Register all plugin routes in a scoped context with catch-all parser
  fastify.register((scope, opts, registered) => {
    // Remove all default parsers for this scope
    scope.removeAllContentTypeParsers();

    // Add catch-all parser that doesn't consume the stream
    scope.addContentTypeParser('*', function (request, payload, done) {
      // Don't parse - leave stream untouched for WHATWG adapter
      done(null);
    });

    for (const route of routes) {
      // Create WHATWG-compliant server adapter
      const adapter = createServerAdapter<PluginServerContext>(
        async (request: Request, serverContext) => {
          const context = {
            ...unchainedAPI,
            ...serverContext.unchainedContext,
            params: serverContext.params || {},
            rawRequest: serverContext.rawRequest,
          };

          try {
            return await route.handler(request, context);
          } catch (error) {
            fastify.log.error(
              `Error in plugin route handler ${route.method} ${route.path}: ${error instanceof Error ? error.message : String(error)}`,
            );

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
        },
      );

      // Determine HTTP methods
      let methods: string[];
      if (route.method === 'ALL') {
        methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
      } else {
        methods = [route.method];
      }

      // Register route in scoped context
      scope.route({
        url: route.path,
        method: methods as any,
        handler: async (req, reply) => {
          const response = await adapter.handleNodeRequestAndResponse(req.raw, reply.raw, {
            unchainedContext: (req as any).unchainedContext,
            params: req.params as Record<string, string>,
            rawRequest: req.raw,
          } as PluginServerContext);

          // Apply response headers
          response.headers.forEach((value, key) => {
            reply.header(key, value);
          });

          // Set status and send body
          reply.status(response.status);
          reply.send(response.body || undefined);

          return reply;
        },
      });
    }

    registered();
  });
}
