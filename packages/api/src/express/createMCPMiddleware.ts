import type { Request, RequestHandler } from 'express';
import type { Context } from '../context.ts';
import { createLogger } from '@unchainedshop/logger';
import { runWithAuditContext } from '@unchainedshop/events';
import handleMcpHttpRequest from '../mcp/handleMcpHttpRequest.ts';
import { toWebRequest, sendWebResponse } from '../http/nodeHttpBridge.ts';

const logger = createLogger('unchained:api:mcp');

const createMCPMiddleware: RequestHandler = async (
  req: Request & { unchainedContext: Context },
  res,
) => {
  try {
    if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    const bodyText =
      req.method === 'POST' && req.body !== undefined ? JSON.stringify(req.body) : undefined;
    const execute = async () => {
      const response = await handleMcpHttpRequest(
        req.unchainedContext,
        toWebRequest(req, res, bodyText),
        req.method === 'POST' ? req.body : undefined,
      );
      await sendWebResponse(res, response);
    };
    const auditContext = (req as any)._auditContext;
    await (auditContext ? runWithAuditContext(auditContext, execute) : execute());
  } catch (error) {
    logger.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.destroy();
    }
  }
};

export default createMCPMiddleware;
