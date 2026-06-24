import type { Context } from '@unchainedshop/api';
import { handleStripeWebhook } from './webhook.ts';

export const stripeHandler = async (request, response) => {
  const result = await handleStripeWebhook({
    rawBody: request.body,
    signature: request.headers['stripe-signature'],
    context: request.unchainedContext as Context,
  });
  response.status(result.statusCode).send(result.body);
};
