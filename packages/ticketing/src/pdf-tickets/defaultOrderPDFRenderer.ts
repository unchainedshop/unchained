import { TicketingAPI } from '../types.js';

export const generateOrderSVG = async (order, tokens, { modules }: TicketingAPI) => {
    let QRCode: any | null = null;
    try {
        QRCode = await import('qrcode');
    } catch {
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

    for await (const token of tokens) {
        if (QRCode) {
            const hash = await modules.warehousing.buildAccessKeyForToken(
                token._id as string,
            );

            lines.push({
                text: `Token #${token.tokenSerialNumber}`,
                qrData: `${process.env.ROOT_URL}/download/${token._id}?hash=${hash}`
            });

        }

        lines.push({ text: `Contract: ${token.contractAddress}` });
        lines.push({ text: `Standard: ${token?.meta?.contractStandard}` });
        lines.push({ text: `Product ID: ${token.productId}` });
        lines.push({ text: `Quantity: ${token.quantity}` });
    }

    tokens.forEach((t) => {

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
                `<text x="${padding}" y="${y + lineHeight}" font-family="Helvetica" font-size="14" fill="#111">${line.text}</text>`,
            );
            y += lineHeight;
        }

        if (line.qrData && QRCode) {
            const qrSvg = await QRCode.toString(line.qrData, { type: 'svg', margin: 0, width: qrSize });
            textAndQrElements.push(
                `<g transform="translate(${svgWidth - padding - qrSize}, ${y - lineHeight})">${qrSvg}</g>`,
            );
        }

        const nextLineIsNewToken = i + 1 < lines.length && lines[i + 1].text?.startsWith('Token #');

        if (nextLineIsNewToken) {
            textAndQrElements.push(
                `<line x1="${padding}" y1="${y}" x2="${svgWidth - padding}" y2="${y}" stroke="#ccc" stroke-width="1"/>`,
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
    const positionsIds = positions.map((p) => p._id);
    const tokens = await modules.warehousing.findTokens({
        orderPositionId: { $in: positionsIds },
    });

    if (!tokens?.length) {
        throw new Error(`No tokens found for order ${orderId}`);
    }
    return { contentType: 'image/svg+xml', renderer: await generateOrderSVG(order, tokens, context) };
};
