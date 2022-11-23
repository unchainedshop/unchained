import { Context } from '@unchainedshop/types/api';
import { Order } from '@unchainedshop/types/orders';

export const getOrderAttachmentsData = async (
  order: Order,
  params: { fileType: string },
  { modules }: Context,
) => {
  const attachments = [];

  const orderFiles = await modules.files.findFiles(
    { 'meta.orderId': order._id, 'meta.type': params.fileType },
    { limit: 1 },
  );
  attachments.concat(orderFiles);
  const payment = await modules.orders.payments.findOrderPayment(
    {
      orderPaymentId: order.paymentId,
    },
    { limit: 1 },
  );
  if (modules.orders.payments.isBlockingOrderFullfillment(payment)) {
    const invoices = await modules.files.findFiles(
      { 'meta.orderId': order._id, 'meta.type': 'INVOICE' },
      { limit: 1 },
    );
    attachments.concat(invoices);
  } else {
    const receipts = await modules.files.findFiles(
      { 'meta.orderId': order._id, 'meta.type': 'RECEIPT' },
      { limit: 1 },
    );
    attachments.concat(receipts);
  }

  return attachments.map((file) => ({
    filename: `${order.orderNumber}_${file.name}`,
    path: file.path,
  }));
};
