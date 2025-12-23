import React from 'react';
import type { Order } from '@unchainedshop/core-orders';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import type { TicketingAPI } from '../types.js';

let PDFRenderer: any = null;
let QRCode: any = null;

try {
  PDFRenderer = await import('@react-pdf/renderer');
} catch {
  PDFRenderer = null;
}

try {
  QRCode = await import('qrcode');
} catch {
  QRCode = null;
}

export type TicketCustomization = {
  title?: string;               
  logoUrl?: string;             
  labels?: {
    orderNumber?: string;
    status?: string;
    date?: string;
    billingAddress?: string;
    contract?: string;
    standard?: string;
    productId?: string;
    quantity?: string;
  };
  ticketTitle?: (token: TokenSurrogate) => string;
  stripText?: (token: TokenSurrogate) => string;
};

export type TicketCustomizationRenderer = (
  order: string,
  context: TicketingAPI,
) => Promise<TicketCustomization>;

const resolveLabel = (
  labelKey: keyof NonNullable<TicketCustomization['labels']>,
  customization?: TicketCustomization,
  defaultValue?: string
) => {
  return customization?.labels?.[labelKey] ?? defaultValue ?? '';
};

const resolveTokenTitle = (
  token: TokenSurrogate,
  customization?: TicketCustomization
) => {
  return customization?.ticketTitle
    ? customization.ticketTitle(token)
    : `Token #${token.tokenSerialNumber}`;
};

const resolveStripText = (
  token: TokenSurrogate,
  customization?: TicketCustomization
) => {
  return customization?.stripText
    ? customization.stripText(token)
    : null;
};


const TicketDocument = ({
  styles,
  order,
  tokens,
  qrSvgs,
  customization,
}: {
  styles: any;
  order: Order;
  tokens: TokenSurrogate[];
  qrSvgs: (string | null)[];
  customization?: TicketCustomization;
}) => {
  const { Document, Page, Text, View, Image } = PDFRenderer;
  

  return (
   <Document>
  <Page style={styles.page}>
    {customization?.logoUrl && (
      <Image src={customization.logoUrl} style={styles.logo} />
    )}

    <Text style={styles.header}>
      {customization?.title ?? 'Ticket Receipt'}
    </Text>    
    <View style={styles.section}>
      <Text>
        {resolveLabel('orderNumber', customization, 'Order Number')}: {order.orderNumber}
      </Text>
      <Text>
        {resolveLabel('status', customization, 'Status')}: {order.status}
      </Text>
      {order.confirmed && (
        <Text>
          {resolveLabel('date', customization, 'Date')}: {order.confirmed.toLocaleString()}
        </Text>
      )}
    </View>    
    {order.billingAddress && (
      <View style={styles.section}>
        <Text>{resolveLabel('billingAddress', customization, 'Billing Address')}:</Text>
        <Text>
          {order.billingAddress.firstName} {order.billingAddress.lastName}
        </Text>
        {order.billingAddress.company && <Text>{order.billingAddress.company}</Text>}
        <Text>{order.billingAddress.addressLine}</Text>
        <Text>
          {order.billingAddress.city}, {order.billingAddress.regionCode}{' '}
          {order.billingAddress.postalCode}
        </Text>
        <Text>{order.billingAddress.countryCode}</Text>
      </View>
    )}    
    {tokens.map((t, idx) => (
      <View key={idx} style={styles.tokenContainer}>
        <Text>{resolveTokenTitle(t, customization)}</Text>

        <Text>
          {resolveLabel('contract', customization, 'Contract')}: {t.contractAddress}
        </Text>
        <Text>
          {resolveLabel('standard', customization, 'Standard')}: {t.meta.contractStandard}
        </Text>
        <Text>
          {resolveLabel('productId', customization, 'Product ID')}: {t.productId}
        </Text>
        <Text>
          {resolveLabel('quantity', customization, 'Quantity')}: {t.quantity}
        </Text>

        {resolveStripText(t, customization) && (
          <Text style={styles.strip}>{resolveStripText(t, customization)}</Text>
        )}

        {qrSvgs[idx] && (
          <View style={styles.qrContainer}>
            <Image src={qrSvgs[idx]!} style={{ width: 60, height: 60 }} />
          </View>
        )}

        {idx < tokens.length - 1 && <View style={styles.separator} />}
      </View>
    ))}
  </Page>
</Document>

  );
};



export const createPDFTicketRenderer =
  (customRenderer?: TicketCustomizationRenderer) =>
  async ({ orderId }: { orderId: string }, context: TicketingAPI) => {
    if (!PDFRenderer) {
      throw new Error('@react-pdf/renderer must be installed');
    }

    const { modules } = context;
    
    const order = await modules.orders.findOrder({ orderId });
    if (!order) throw new Error(`Order ${orderId} not found`);

    const positions = await modules.orders.positions.findOrderPositions({ orderId });
    const positionIds = positions.map(p => p._id);

    const tokens = await modules.warehousing.findTokens({
      orderPositionId: { $in: positionIds },
    });
    
    const customization = customRenderer ? await customRenderer(orderId, context) : undefined;
    
    let qrSvgs: (string | null)[] = [];
    if (QRCode) {
      qrSvgs = await Promise.all(
        tokens.map(async t => {
          const hash = await modules.warehousing.buildAccessKeyForToken(t._id as string);
          return QRCode.toDataURL(`${process.env.ROOT_URL}/download/${t._id}?hash=${hash}`, {
            errorCorrectionLevel: 'H',
          });
        })
      );
    }

    const { StyleSheet } = PDFRenderer;
    const styles = StyleSheet.create({
      page: { padding: 20, fontSize: 12 },
      header: { fontSize: 16, marginBottom: 10 },
      section: { marginBottom: 10 },
      tokenContainer: { marginTop: 10, marginBottom: 10, position: 'relative' },
      separator: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 5 },
      qrContainer: { position: 'absolute', right: 0, top: 0 },
      logo: { width: 120, marginBottom: 12 },
      strip: { marginTop: 6, fontSize: 10, color: '#666' },
    });

    return {
      contentType: 'application/pdf',
      renderer: await PDFRenderer.renderToStream(
        <TicketDocument
          order={order}
          tokens={tokens}
          qrSvgs={qrSvgs}
          customization={customization}
          styles={styles}
        />
      ),
    };
  };
