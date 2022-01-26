import { Context } from '@unchainedshop/types/api';
import { Order } from '@unchainedshop/types/orders';

export const getOrderAttachmentsData = async (
  order: Order,
  params: { fileType: string },
  { modules }: Context,
) => {
  const orderId = order._id;
  const attachments = [];

  const orderFiles = await modules.files.findFilesByMetaData(
    {
      meta: { orderId: order._id, type: params.fileType },
    },
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
    const invoices = await modules.files.findFilesByMetaData(
      {
        meta: { orderId, type: 'INVOICE' },
      },
      { limit: 1 },
    );
    attachments.concat(invoices);
  } else {
    const receipts = await modules.files.findFilesByMetaData(
      {
        meta: { orderId, type: 'RECEIPT' },
      },
      { limit: 1 },
    );
    attachments.concat(receipts);
  }

  return attachments.map((file) => ({
    filename: `${order.orderNumber}_${file.name}`,
    path: file.path,
  }));
};
