import type { FastifyReply, FastifyRequest } from 'fastify';
import { handleACPRequest } from '../acp/handler.ts';

export default async function acpHandler(req: FastifyRequest, reply: FastifyReply) {
  const wildcard = (req.params as { '*': string })['*'] || '';
  const response = await handleACPRequest({
    method: req.method,
    path: `/${wildcard}`,
    headers: req.headers,
    body: req.body,
    context: (req as any).unchainedContext,
  });
  Object.entries(response.headers || {}).forEach(([name, value]) => reply.header(name, value));
  if (response.contentType) reply.type(response.contentType);
  return reply.status(response.status).send(response.body);
}
