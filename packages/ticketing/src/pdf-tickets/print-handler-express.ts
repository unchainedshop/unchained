import { checkAction } from '@unchainedshop/api/lib/acl.js';
import { actions } from '@unchainedshop/api/lib/roles/index.js';
import { Context } from '@unchainedshop/api';
import { RendererTypes, getRenderer } from '../template-registry.js';
import type { Request, Response } from 'express';

import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:ticketing');

export async function printTicketsHandler(req: Request & { unchainedContext: Context }, res: Response) {
  const { variant, orderId, otp } = req.query || {};

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
    res.setHeader('Content-Type', 'application/pdf');
    pdfStream.pipe(res);
  } catch (error) {
    logger.error(error);
    res.status(403).end();
  }
}

export default printTicketsHandler;
