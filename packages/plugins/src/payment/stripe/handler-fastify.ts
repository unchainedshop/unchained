import type { Context } from '@unchainedshop/api';
import type { FastifyRequest, RouteHandlerMethod } from 'fastify';
import { handleStripeWebhook } from './webhook.ts';

export const stripeHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: Context;
  },
  reply,
) => {
  const result = await handleStripeWebhook({
    rawBody: req.body as string,
    signature: req.headers['stripe-signature'],
    context: req.unchainedContext as Context,
  });
  reply.status(result.statusCode);
  return reply.send(result.body);
};
