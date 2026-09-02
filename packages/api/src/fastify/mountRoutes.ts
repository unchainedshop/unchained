import { Readable } from 'node:stream';
import type { FastifyInstance } from 'fastify';
import type { PluginHttpRoute, UnchainedCore } from '@unchainedshop/core';
import { executePluginRoute } from '../http/executePluginRoute.ts';
import { toWebRequest } from '../http/nodeHttpBridge.ts';
import { sendFastifyWebResponse } from './sendWebResponse.ts';

export function mountRoutes(
  fastify: FastifyInstance,
  unchainedCore: UnchainedCore,
  routes: PluginHttpRoute[],
): void {
  if (routes.length === 0) return;

  const endpoints = routes.map((route) => `${route.method} ${route.path}`).join(', ');
  fastify.log.info(`Mounting ${routes.length} route(s): ${endpoints}`);

  fastify.register((scope, _options, registered) => {
    scope.removeAllContentTypeParsers();
    scope.addContentTypeParser('*', (_request, payload, done) => {
      done(null, payload);
    });

    for (const route of routes) {
      const methods =
        route.method === 'ALL' ? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] : [route.method];

      scope.route({
        url: route.path,
        method: methods as any,
        handler: async (request, reply) => {
          const parsedBody =
            request.body instanceof Readable && !request.body.readableEnded && !request.body.destroyed
              ? request.body
              : undefined;
          const webResponse = await executePluginRoute({
            route,
            request: toWebRequest(request.raw, reply.raw, parsedBody),
            unchainedCore,
            requestContext: (request as any).unchainedContext,
            params: request.params as Record<string, string>,
            auditContext: (request as any)._auditContext,
          });

          return sendFastifyWebResponse(reply, webResponse);
        },
      });
    }

    registered();
  });
}
