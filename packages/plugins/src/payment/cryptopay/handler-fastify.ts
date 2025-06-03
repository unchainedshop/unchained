import { FastifyRequest, RouteHandlerMethod } from 'fastify';
import handleWebhook from './handle-webhook.js';

const cryptopayHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: any;
  },
  reply,
) => {
  try {
    await handleWebhook(req.body as any, req.unchainedContext);
    reply.status(200);
    return reply.send({ success: true });
  } catch (e) {
    reply.status(500);
    return reply.send({ success: false, error: e.message });
  }
};

export default cryptopayHandler;
