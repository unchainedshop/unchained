import { checkAction } from '@unchainedshop/api/lib/acl.js';
import { actions } from '@unchainedshop/api/lib/roles/index.js';
import { RendererTypes, getRenderer } from '../template-registry.js';
import { TicketingAPI } from '../types.js';
import type { FastifyRequest, RouteHandlerMethod } from 'fastify';

const printTicketsHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: TicketingAPI;
  },
  reply,
) => {
  const { variant, orderId, otp } = (req.query as Record<string, any>) || {};

  try {
    if (
      typeof orderId !== 'string' ||
      typeof otp !== 'string' ||
      (variant && typeof variant !== 'string')
    )
      throw new Error('Invalid query parameter');

    await checkAction(req.unchainedContext, actions.viewOrder, [undefined, { orderId, otp }]);

    const render = getRenderer(RendererTypes.ORDER_PDF);
    const pdfStream = await render({ orderId, variant: variant as string }, req.unchainedContext);
    reply.header('content-type', 'application/pdf');
    return reply.send(pdfStream);
  } catch (error) {
    console.error(error);
    reply.status(403);
    return reply.send();
  }
};

export default printTicketsHandler;
