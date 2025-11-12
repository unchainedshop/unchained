import React from 'react';
import { Order } from '@unchainedshop/core-orders';
import { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { TicketingAPI } from '../types.js';

let PDFRenderer: any = null;
let QRCode: any = null;

try {
  import('@react-pdf/renderer').then((mod) => {
    PDFRenderer = mod;
  });
} catch {
  PDFRenderer = null;
}

try {
  import('qrcode').then((mod) => {
    QRCode = mod;
  });
} catch {
  QRCode = null;
}

const TicketDocument = ({
  styles,
  order,
  tokens,
  qrSvgs,
}: {
  tokens?: TokenSurrogate[];
  order: Order;
  styles: any;
  qrSvgs: any;
}) => {
  if (!PDFRenderer) {
    throw new Error('@react-pdf/renderer is not installed');
  }
  const { Document, Page, Text, View, Svg, Image } = PDFRenderer;

  

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>Order Confirmation / NFT Certificate</Text>
        <View style={styles.section}>
          <Text>Order Number: {order.orderNumber}</Text>
          <Text>Status: {order.status}</Text>
          {order.confirmed && <Text>Date: {order.confirmed.toLocaleString()}</Text>}
        </View>

        {order.billingAddress && (
          <View style={styles.section}>
            <Text>Billing Address:</Text>
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

        {tokens?.map((t, idx) => (
          <View key={idx} style={styles.tokenContainer}>
            <Text>Token #{t.tokenSerialNumber}</Text>
            <Text>Contract: {t.contractAddress}</Text>
            <Text>Standard: {t.meta.contractStandard}</Text>
            <Text>Product ID: {t.productId}</Text>
            <Text>Quantity: {t.quantity}</Text>

            
{qrSvgs[idx] && (
  <View style={styles.qrContainer}>
    <Image src={qrSvgs[idx]} style={{ width: 60, height: 60 }} />
  </View>
)}

            {idx < tokens?.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </Page>
    </Document>
  );
};

export const createPDFTicketRenderer = async (
  { orderId }: { orderId: string },
  context: TicketingAPI,
) => {
  let qrSvgs: (string | null)[] = [];

  if (!PDFRenderer) {
    throw new Error('@react-pdf/renderer is not installed');
  }
  const { modules } = context;

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const positions = await modules.orders.positions.findOrderPositions({ orderId });
  const positionsIds = positions.map((p) => p._id);
  const tokens = await modules.warehousing.findTokens({
    orderPositionId: { $in: positionsIds },
  });

  if (QRCode && tokens?.length) {
    qrSvgs = await Promise.all(
      tokens?.map(async (token) => {
        const hash = await modules.warehousing.buildAccessKeyForToken(
    token._id as string,
  );
      return QRCode.toDataURL(`${process.env.ROOT_URL}/download/${token._id}?hash=${hash}`, {
    errorCorrectionLevel: "H",
  }) 
      }
        
      ),
    );
  }  
  const { StyleSheet } = PDFRenderer;

  const styles = StyleSheet.create({
    page: { padding: 20, fontSize: 12, fontFamily: 'Helvetica' },
    header: { fontSize: 16, marginBottom: 10 },
    section: { marginBottom: 10 },
    tokenContainer: { marginTop: 10, marginBottom: 10, position: 'relative' },
    separator: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 5 },
    qrContainer: { position: 'absolute', right: 0, top: 0 },
  });

  return {
    contentType: 'application/pdf',
    renderer: await PDFRenderer.renderToStream(
      <TicketDocument order={order} tokens={tokens} styles={styles} qrSvgs={qrSvgs} />,
    ),
  };
};
