import type { FastifyRequest, RouteHandlerMethod } from 'fastify';
import type { Context } from '../context.ts';
import { createLogger } from '@unchainedshop/logger';
import { runWithAuditContext } from '@unchainedshop/events';
import handleMcpHttpRequest from '../mcp/handleMcpHttpRequest.ts';
import { toWebRequest } from '../http/nodeHttpBridge.ts';
import { sendFastifyWebResponse } from './sendWebResponse.ts';

const logger = createLogger('unchained:api:mcp');

const mcpHandler: RouteHandlerMethod = async (
  req: FastifyRequest & { unchainedContext: Context },
  res,
) => {
  try {
    const bodyText =
      req.method === 'POST' && req.body !== undefined ? JSON.stringify(req.body) : undefined;
    const execute = async () => {
      const response = await handleMcpHttpRequest(
        req.unchainedContext,
        toWebRequest(req.raw, res.raw, bodyText),
        req.method === 'POST' ? req.body : undefined,
      );
      return sendFastifyWebResponse(res, response);
    };
    const auditContext = (req as any)._auditContext;
    return await (auditContext ? runWithAuditContext(auditContext, execute) : execute());
  } catch (error) {
    logger.error(error);
    if (!res.sent) {
      return res.status(500).send({ error: 'Internal Server Error' });
    }
    res.raw.destroy();
    return res;
  }
};

export default mcpHandler;
