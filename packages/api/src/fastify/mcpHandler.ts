import type { RouteHandlerMethod, FastifyRequest } from 'fastify';
import type { Context } from '../context.ts';
import { authenticateMCP, handleMCPRequest } from '../mcp/mcpSessionManager.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:mcp');

const mcpHandler: RouteHandlerMethod = async (
  req: FastifyRequest & { unchainedContext: Context },
  res,
) => {
  const auth = authenticateMCP(req.unchainedContext.user);
  if (auth.error) {
    if (auth.error.headers) {
      for (const [key, value] of Object.entries(auth.error.headers)) {
        res.header(key, value);
      }
    }
    res.status(auth.error.status);
    return res.send(auth.error.body);
  }

  try {
    await handleMCPRequest({
      method: req.method,
      sessionId: req.headers['mcp-session-id'] as string | undefined,
      body: req.body,
      userId: auth.userId!,
      roles: auth.roles!,
      context: req.unchainedContext,
      nodeReq: req.raw,
      nodeRes: res.raw,
    });
    return res;
  } catch (e: any) {
    logger.error(e);
    return res.status(503).send({ name: e.name, code: e.code, message: e.message });
  }
};

export default mcpHandler;
