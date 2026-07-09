import type { RequestHandler } from 'express';
import type { Context } from '../context.ts';
import { authenticateMCP, handleMCPRequest } from '../mcp/mcpSessionManager.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:mcp');

const createMCPMiddleware: RequestHandler = async (req, res) => {
  const auth = authenticateMCP((req as any).unchainedContext.user);
  if (auth.error) {
    if (auth.error.headers) {
      for (const [key, value] of Object.entries(auth.error.headers)) {
        res.header(key, value);
      }
    }
    res.status(auth.error.status).send(auth.error.body);
    return;
  }

  try {
    await handleMCPRequest({
      method: req.method,
      sessionId: req.headers['mcp-session-id'] as string | undefined,
      body: req.body,
      userId: auth.userId!,
      roles: auth.roles!,
      context: (req as any).unchainedContext as Context,
      nodeReq: req,
      nodeRes: res,
    });
  } catch (e: any) {
    logger.error(e);
    res.status(503).json({ name: e.name, code: e.code, message: e.message });
  }
};

export default createMCPMiddleware;
