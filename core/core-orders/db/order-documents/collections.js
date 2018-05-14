import { FilesCollection } from 'meteor/ostrio:files';
import { fileStoragePath } from 'meteor/unchained:utils';

export const OrderDocuments = new FilesCollection({
  storagePath: fileStoragePath('order_documents'),
  collectionName: 'order_documents',
  allowClientCode: false, // Disallow remove files from Client
  onBeforeUpload(file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 10485760) {
      return true;
    }
    return 'Please upload image, with size equal or less than 10MB';
  },
});

export default OrderDocuments;
