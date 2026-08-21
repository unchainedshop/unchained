import type { FastifyRequest, RouteHandlerMethod } from 'fastify';
import type { Context } from '../context.ts';
import { Readable } from 'node:stream';
import { createLogger } from '@unchainedshop/logger';
import handleMcpHttpRequest from '../mcp/handleMcpHttpRequest.ts';
import { toWebRequest } from '../mcp/nodeHttpBridge.ts';

const logger = createLogger('unchained:api:mcp');

const mcpHandler: RouteHandlerMethod = async (
  req: FastifyRequest & { unchainedContext: Context },
  res,
) => {
  try {
    const bodyText =
      req.method === 'POST' && req.body !== undefined ? JSON.stringify(req.body) : undefined;
    const response = await handleMcpHttpRequest(
      req.unchainedContext,
      toWebRequest(req.raw, res.raw, bodyText),
      req.method === 'POST' ? req.body : undefined,
    );

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key === 'set-cookie') return;
      res.header(key, value);
    });
    const setCookie = response.headers.getSetCookie();
    if (setCookie.length) res.header('set-cookie', setCookie);

    if (!response.body) return res.send();
    return res.send(Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]));
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
