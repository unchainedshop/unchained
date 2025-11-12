
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




export const generateOrderSVG = async (order, tokens) => {

  let QRCode: any | null = null;
  try {
    QRCode = await import('qrcode');
  } catch (e) {
    QRCode = null;
  }

  const lines: { text: string; qrData?: string }[] = [];

  lines.push({ text: `Order Confirmation / NFT Certificate` });
  lines.push({ text: `Order Number: ${order.orderNumber}` });
  lines.push({ text: `Status: ${order.status}` });
  lines.push({ text: `Date: ${order.confirmed.toLocaleString()}` });

  if (order.billingAddress) {
    const addr = order.billingAddress;
    lines.push({ text: `Billing Address:` });
    lines.push({ text: `${addr.firstName} ${addr.lastName}` });
    if (addr.company) lines.push({ text: addr.company });
    lines.push({ text: `${addr.addressLine}` });
    lines.push({ text: `${addr.city}, ${addr.regionCode} ${addr.postalCode}` });
    lines.push({ text: `${addr.countryCode}` });
  }

  tokens.forEach((t) => {
    lines.push({ text: `Token #${t.tokenSerialNumber}`, qrData: QRCode ? JSON.stringify(t) : undefined });
    lines.push({ text: `Contract: ${t.contractAddress}` });
    lines.push({ text: `Standard: ${t.meta.contractStandard}` });
    lines.push({ text: `Product ID: ${t.productId}` });
    lines.push({ text: `Quantity: ${t.quantity}` });
    lines.push({ text: '', qrData: undefined });
  });

  const lineHeight = 20;
  const padding = 20;
  const qrSize = 60;
  const svgWidth = 600;
  const svgHeight = lines.length * lineHeight + padding * 2 + (QRCode ? tokens.length * qrSize : 0);
  let y = padding;
  const textAndQrElements: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];


    if (line.text) {
      textAndQrElements.push(
        `<text x="${padding}" y="${y + lineHeight}" font-family="Helvetica" font-size="14" fill="#111">${line.text}</text>`
      );
      y += lineHeight;
    }

    if (line.qrData && QRCode) {
      const qrSvg = await QRCode.toString(line.qrData, { type: 'svg', margin: 0, width: qrSize });
      textAndQrElements.push(
        `<g transform="translate(${svgWidth - padding - qrSize}, ${y - lineHeight})">${qrSvg}</g>`
      );

    }

    const nextLineIsNewToken =
      i + 1 < lines.length &&
      lines[i + 1].text?.startsWith("Token #");

    if (nextLineIsNewToken) {
      textAndQrElements.push(
        `<line x1="${padding}" y1="${y}" x2="${svgWidth - padding}" y2="${y}" stroke="#ccc" stroke-width="1"/>`
      );
      y += 10;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
${textAndQrElements.join('\n')}
</svg>`;

  return svg;
};

export const defaultOrderPDFRenderer = async (
  { orderId }: { orderId: string },
  context: TicketingAPI,
) => {
  const { modules } = context;

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new Error(`Order ${orderId} not found`);


  const positions = await modules.orders.positions.findOrderPositions({ orderId });
  const positionsIds = positions.map(p => p._id);
  const tokens = await modules.warehousing.findTokens({
    orderPositionId: { $in: positionsIds },
  });

  if (!tokens?.length) {
    throw new Error(`No tokens found for order ${orderId}`);
  }
  return generateOrderSVG(order, tokens)
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
