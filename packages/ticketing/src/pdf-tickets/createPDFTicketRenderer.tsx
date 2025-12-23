import React from 'react';
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

interface BillingAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine?: string;
  city?: string;
  regionCode?: string;
  postalCode?: string;
  countryCode?: string;
}
interface TicketItem {
  contractStandard?: string;
  contractAddress?: string;
  productId?: string;
  quantity?: number;
  qrCode?: string;
  label?: string;
}

export interface TicketCustomization {
  title?: string;
  logoUrl?: string;
  orderNumber?: string;
  status?: any;
  date?: Date;
  billingAddress?: BillingAddress;
  confirmed?: any;
  tickets: TicketItem[];
}

export type TicketCustomizationRenderer = (
  order: string,
  context: TicketingAPI,
) => Promise<TicketCustomization>;

const defaultRenderer = async (orderId: string, context: TicketingAPI): Promise<TicketCustomization> => {
  const { modules } = context;

  const [order, positions] = await Promise.all([
    modules.orders.findOrder({ orderId }),
    modules.orders.positions.findOrderPositions({ orderId }),
  ]);

  if (!order) throw new Error(`Order ${orderId} not found`);

  const tokens = await modules.warehousing.findTokens({
    orderPositionId: { $in: positions.map((p) => p._id) },
  });

  const tickets = await Promise.all(
    tokens.map(async (token) => {
      const hash = await modules.warehousing.buildAccessKeyForToken(token._id as string);
      const qrCode = QRCode
        ? await QRCode.toDataURL(`${process.env.ROOT_URL}/download/${token._id}?hash=${hash}`, {
            errorCorrectionLevel: 'H',
          })
        : undefined;

      return {
        contractAddress: token.contractAddress,
        contractStandard: token.meta?.contractStandard,
        productId: token.productId,
        quantity: token.quantity,
        qrCode,
        label: 'Ticket ID:',
      };
    }),
  );

  return {
    ...order,
    tickets,
  };
};

const TicketDocument = ({ data, styles }: { data: TicketCustomization; styles: any }) => {
  if (!PDFRenderer) return null;
  const { Document, Page, Text, View, Image } = PDFRenderer;

  return (
    <Document>
      <Page style={styles.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
            <Text style={styles.header}>{data.title ?? 'Ticket Receipt'}</Text>
          </View>
          <View style={{ textAlign: 'right', fontSize: 10 }}>
            <Text>Order #: {data.orderNumber}</Text>
            <Text>Status: {data.status}</Text>
            {data.confirmed && <Text>Date: {new Date(data.confirmed).toLocaleDateString()}</Text>}
          </View>
        </View>

        {data.billingAddress && (
          <View style={[styles.section, { borderTop: 1, paddingTop: 10, borderColor: '#eee' }]}>
            <Text style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>BILLING TO:</Text>
            <Text style={{ fontWeight: 'bold' }}>
              {data.billingAddress.firstName} {data.billingAddress.lastName}
            </Text>
            {data.billingAddress.company && <Text>{data.billingAddress.company}</Text>}
            <Text>{data.billingAddress.addressLine}</Text>
            <Text>
              {data.billingAddress.city}, {data.billingAddress.regionCode}{' '}
              {data.billingAddress.postalCode}
            </Text>
            <Text>{data.billingAddress.countryCode}</Text>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 10,
              color: '#666',
              borderBottom: 1,
              borderColor: '#eee',
              paddingBottom: 4,
            }}
          >
            YOUR TICKETS
          </Text>
          {data.tickets.map((t, idx) => (
            <View key={idx} style={styles.tokenContainer} wrap={false}>
              <View style={styles.details}>
                <Text style={{ fontWeight: 'bold' }}>
                  {t.label} {t.productId}
                </Text>
                <Text style={{ fontSize: 10, color: '#444' }}>Standard: {t.contractStandard}</Text>
                <Text style={{ fontSize: 9, color: '#888' }}>Contract: {t.contractAddress}</Text>
                <Text>Quantity: {t.quantity}</Text>
              </View>

              {t.qrCode && (
                <View style={styles.qrContainer}>
                  <Image src={t.qrCode} style={{ width: 65, height: 65 }} />
                </View>
              )}

              {idx < data.tickets.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        <View
          style={{
            position: 'absolute',
            bottom: 30,
            left: 20,
            right: 20,
            borderTop: 1,
            borderColor: '#eee',
            paddingTop: 10,
          }}
        ></View>
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

    const data = customRenderer
      ? await customRenderer(orderId, context)
      : await defaultRenderer(orderId, context);

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
      renderer: await PDFRenderer.renderToStream(<TicketDocument data={data} styles={styles} />),
    };
  };
