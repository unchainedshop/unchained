import { checkAction } from '@unchainedshop/api/lib/acl.js';
import { actions } from '@unchainedshop/api/lib/roles/index.js';
import { RendererTypes, getRenderer } from '../template-registry.ts';
import type { TicketingAPI } from '../types.ts';
import type { FastifyRequest, RouteHandlerMethod } from 'fastify';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:ticketing:print-handler');

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
    reply.header('content-type', 'image/svg+xml');
    return reply.send(pdfStream);
  } catch (error) {
    logger.error(error);
    reply.status(403);
    return reply.send({
      success: false,
      message: 'Error generating PDF',
      name: 'PDF_GENERATION_ERROR',
    });
  }
};

export default printTicketsHandler;
