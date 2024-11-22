import { checkAction } from '@unchainedshop/api/lib/acl.js';
import { actions } from '@unchainedshop/api/lib/roles/index.js';
import express, { Request, Response } from 'express';
import { Context } from '@unchainedshop/api';
import { RendererTypes, getRenderer } from '../template-registry.js';

const { UNCHAINED_PDF_PRINT_HANDLER_PATH = '/rest/print_tickets' } = process.env;

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
    console.error(error);
    res.status(403);
    res.end();
  }
}

export default function connectPrintWebservice(app) {
  app.use(
    UNCHAINED_PDF_PRINT_HANDLER_PATH,
    express.json({
      type: 'application/json',
    }),
    printTicketsHandler,
  );
}
