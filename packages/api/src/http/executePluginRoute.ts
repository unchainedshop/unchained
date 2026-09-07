import type { PluginHttpRequestContext, PluginHttpRoute, UnchainedCore } from '@unchainedshop/core';
import { runWithAuditContext, type AuditRequestContext } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:plugin-routes');

export async function executePluginRoute({
  route,
  request,
  unchainedCore,
  requestContext,
  params,
  auditContext,
}: {
  route: PluginHttpRoute;
  request: Request;
  unchainedCore: UnchainedCore;
  requestContext?: Omit<PluginHttpRequestContext, keyof UnchainedCore | 'params'>;
  params: Record<string, string>;
  auditContext?: AuditRequestContext;
}): Promise<Response> {
  const context = {
    ...unchainedCore,
    ...requestContext,
    params,
  } as PluginHttpRequestContext;
  const execute = () => route.handler(request, context);

  try {
    return await (auditContext ? runWithAuditContext(auditContext, execute) : execute());
  } catch (error) {
    logger.error(`Error in route handler ${route.method} ${route.path}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
