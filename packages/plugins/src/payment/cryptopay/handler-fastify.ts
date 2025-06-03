import { createLogger } from '@unchainedshop/logger';
import handleWebhook from './handle-webhook.js';

const logger = createLogger('unchained:core-payment:cryptopay');
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

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
