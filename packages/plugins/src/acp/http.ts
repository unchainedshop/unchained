import type { PluginHttpRoute } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import type { ACPContext } from './config.ts';
import { verifyACPRequest } from './auth.ts';
import { ACPError } from './error.ts';
import { createIdempotencyScope, withIdempotency, type ACPRouteResult } from './idempotency.ts';

type ACPRouteAction = (
  request: Request,
  context: ACPContext,
  body: Record<string, any>,
) => Promise<ACPRouteResult>;

const logger = createLogger('unchained:acp');

const responseFrom = (result: ACPRouteResult, headers: Record<string, string>) => {
  const body = result.contentType ? (result.body as BodyInit) : JSON.stringify(result.body);
  return new Response(body, {
    status: result.status,
    headers: {
      'Content-Type': result.contentType || 'application/json',
      ...result.headers,
      ...headers,
    },
  });
};

const parseBody = async (request: Request) => {
  if (request.method !== 'POST') return {};
  try {
    const rawBody = await request.text();
    if (!rawBody.trim()) return {};
    const body = JSON.parse(rawBody);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Expected a JSON object');
    }
    return body as Record<string, any>;
  } catch {
    throw new ACPError(400, 'invalid_request', 'invalid_json', 'Request body must be a JSON object');
  }
};

export const createACPRoute = (
  path: string,
  method: PluginHttpRoute['method'],
  operation: string,
  action: ACPRouteAction,
  { authenticate = true }: { authenticate?: boolean } = {},
): PluginHttpRoute => ({
  path,
  method,
  handler: async (request, context) => {
    const requestId = request.headers.get('request-id') || crypto.randomUUID();
    try {
      if (authenticate) await verifyACPRequest(request);
      const body = await parseBody(request);
      const idempotencyKey = request.headers.get('idempotency-key');
      const result =
        request.method === 'POST' && idempotencyKey
          ? await withIdempotency(
              createIdempotencyScope({
                authorization: request.headers.get('authorization'),
                operation,
                resourceId: context.params.id,
              }),
              idempotencyKey,
              body,
              () => action(request, context, body),
            )
          : { ...(await action(request, context, body)), replayed: false };

      return responseFrom(result, {
        'Request-Id': requestId,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...(result.replayed ? { 'Idempotent-Replayed': 'true' } : {}),
      });
    } catch (error) {
      if (error instanceof ACPError) {
        return responseFrom(
          { status: error.status, body: error.toJSON(), headers: error.options.headers },
          { 'Request-Id': requestId },
        );
      }
      logger.error('Unexpected ACP route error', {
        operation,
        error: error instanceof Error ? error.message : String(error),
      });
      return responseFrom(
        {
          status: 500,
          body: {
            type: 'processing_error',
            code: 'internal_error',
            message: 'The request could not be processed',
          },
        },
        { 'Request-Id': requestId },
      );
    }
  },
});
