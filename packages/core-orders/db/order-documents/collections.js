import { createFilesCollection } from 'meteor/unchained:core-files';

export const OrderDocuments = createFilesCollection('order_documents', {
  maxSize: 10485760,
});

export default OrderDocuments;
