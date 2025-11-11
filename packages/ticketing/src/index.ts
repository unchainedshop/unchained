
import { subscribe } from '@unchainedshop/events';
import type { RawPayloadType } from '@unchainedshop/events';
import { WorkerEventTypes, type Work } from '@unchainedshop/core-worker';
import { RendererTypes, registerRenderer } from './template-registry.ts';
import ticketingModules, { type TicketingModule } from './module.ts';

import type { TicketingAPI } from './types.ts';
import setupMagicKey from './magic-key.ts';
import ticketingServices, { type TicketingServices } from './services.ts';

import { defaultTicketReceiptRenderer } from './pdf-tickets/defaultTicketReceiptRenderer.js';

export type { TicketingAPI, RendererTypes, TicketingModule, TicketingServices };

export { ticketingServices, ticketingModules };

export const defaultOrderPDFRenderer = async (
  { orderId }: { orderId: string },
  context: TicketingAPI,
): Promise<Buffer> => {
  const { modules } = context;

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const lines: string[] = [
    'NOTICE: You are using the default Unchained Ticket PDF Renderer.',
    'This is a placeholder template.',
    'Please implement your own PDF ticket renderer for production use.',
    '------------------------------------',
    `Order Number: ${order.orderNumber}`,
    `Date: ${new Date(order?.confirmed as Date).toLocaleString()}`,
  ];

  const escapePDFText = (text: string) => text.replace(/([()\\])/g, '\\$1');

  const startY = 780;
  const lineHeight = 20;
  const pdfTextBlocks: string[] = [];

  lines.forEach((line, i) => {
    const y = startY - i * lineHeight;
    pdfTextBlocks.push(`BT
/F1 14 Tf
1 0 0 1 50 ${y} Tm
(${escapePDFText(line)}) Tj
ET`);
  });

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${pdfTextBlocks.join('\n').length + 50} >>
stream
${pdfTextBlocks.join('\n')}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000115 00000 n
0000000310 00000 n
trailer
<< /Root 1 0 R /Size 6 >>
startxref
400
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
};

export function setupPDFTickets({ renderOrderPDF }: { renderOrderPDF: any }) {
  registerRenderer(RendererTypes.ORDER_PDF, renderOrderPDF);
}

export function setupMobileTickets({
  createGoogleWalletPass,
  createAppleWalletPass,
}: {
  createGoogleWalletPass: any;
  createAppleWalletPass: any;
}) {
  registerRenderer(RendererTypes.GOOGLE_WALLET, createGoogleWalletPass);
  registerRenderer(RendererTypes.APPLE_WALLET, createAppleWalletPass);
}

export default function setupTicketing(
  unchainedAPI: TicketingAPI,
  {
    renderOrderPDF = defaultTicketReceiptRenderer,
    createAppleWalletPass,
    createGoogleWalletPass,
  }: {
    renderOrderPDF?: any;
    createAppleWalletPass: any;
    createGoogleWalletPass: any;
  },
) {
  setupPDFTickets({
    renderOrderPDF,
  });
  setupMobileTickets({
    createAppleWalletPass,
    createGoogleWalletPass,
  });

  if (!process.env.UNCHAINED_SECRET)
    throw new Error(
      'Unchained Ticketing needs the UNCHAINED_SECRET environment variable to be set in order to allow magic key access to orders and tokens.',
    );

  setupMagicKey();

  subscribe('TOKEN_INVALIDATED', async () => {
    await unchainedAPI.modules.passes.invalidateAppleWalletPasses(unchainedAPI);
  });

  subscribe(WorkerEventTypes.FINISHED, async ({ payload: work }: RawPayloadType<Work>) => {
    if ((work.type === 'EXPORT_TOKEN' || work.type === 'UPDATE_TOKEN_OWNERSHIP') && work.success) {
      await unchainedAPI.modules.passes.invalidateAppleWalletPasses(unchainedAPI);
    }
  });
}
