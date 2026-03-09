import type { FastifyInstance } from 'fastify';
import { createServerAdapter } from '@whatwg-node/server';

import { ticketingRoutes } from './routes.ts';
import googleWalletHandler from './mobile-tickets/google-handler-fastify.ts';
import printTicketsHandler from './pdf-tickets/print-handler-fastify.ts';
import appleWalletHandler from './mobile-tickets/apple-handler-fastify.ts';

export default (fastify: FastifyInstance) => {
  if (ticketingRoutes.length === 0) return;
  const {
    APPLE_WALLET_WEBSERVICE_PATH = '/rest/apple-wallet',
    GOOGLE_WALLET_WEBSERVICE_PATH = '/rest/google-wallet',
    UNCHAINED_PDF_PRINT_HANDLER_PATH = '/rest/print_tickets',
  } = process.env;

  fastify.route({
    url: `${UNCHAINED_PDF_PRINT_HANDLER_PATH}`,
    method: 'GET',
    handler: printTicketsHandler,
  });

  fastify.route({
    url: `${APPLE_WALLET_WEBSERVICE_PATH}*`,
    method: ['GET', 'POST', 'DELETE'],
    handler: appleWalletHandler,
  });

  fastify.route({
    url: `${GOOGLE_WALLET_WEBSERVICE_PATH}/download/:tokenId`,
    method: 'GET',
    handler: googleWalletHandler,
  });

  // Register all ticketing routes in a scoped context with catch-all parser
  fastify.register((scope, opts, registered) => {
    // Remove all default parsers for this scope
    scope.removeAllContentTypeParsers();

    // Add catch-all parser that doesn't consume the stream
    scope.addContentTypeParser('*', function (request, payload, done) {
      // Don't parse - leave stream untouched for WHATWG adapter
      done(null);
    });

    for (const route of ticketingRoutes) {
      // Create WHATWG-compliant server adapter
      const adapter = createServerAdapter(async (request: Request, serverContext: any) => {
        const context = {
          ...serverContext.unchainedContext,
          params: serverContext.params || {},
        };

        return await route.handler(request, context);
      });

      // Mount the route - convert /* to wildcard Fastify route
      const fastifyPath = route.path.replace(/\/\*$/, '/*');

      scope.all(fastifyPath, async (req, reply) => {
        try {
          const response = await adapter.handleNodeRequestAndResponse(req.raw, reply.raw, {
            unchainedContext: (req as any).unchainedContext,
            params: req.params as Record<string, string>,
          } as any);

          // Apply response headers
          response.headers.forEach((value, key) => {
            reply.header(key, value);
          });

          // Set status and send body
          reply.status(response.status);
          reply.send(response.body || undefined);

          return reply;
        } catch {
          if (!reply.sent) {
            reply.status(500).send({ error: 'Internal Server Error' });
          }
        }
      });
    }

    registered();
  });
};
