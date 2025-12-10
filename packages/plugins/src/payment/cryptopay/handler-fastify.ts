import { createLogger } from '@unchainedshop/logger';
import handleWebhook from './handle-webhook.ts';
import { type FastifyRequest, type RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:cryptopay:handler');

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
    logger.error(e);
    reply.status(500);
    return reply.send({ success: false, error: e.message });
  }
};

export default cryptopayHandler;
