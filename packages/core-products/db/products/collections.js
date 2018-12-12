import { FilesCollection } from 'meteor/ostrio:files';
import { Mongo } from 'meteor/mongo';
import { fileStoragePath } from 'meteor/unchained:utils';

export const Products = new Mongo.Collection('products');
export const ProductTexts = new Mongo.Collection('product_texts');
export const ProductMedia = new Mongo.Collection('product_media');
export const ProductMediaTexts = new Mongo.Collection('product_media_texts');

export const Media = new FilesCollection({
  storagePath: fileStoragePath('media'),
  collectionName: 'media',
  allowClientCode: false, // Disallow remove files from Client
  onBeforeUpload(file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 10485760 && /png|jpg|jpeg/i.test(file.extension)) {
      return true;
    }
    return 'Please upload image, with size equal or less than 10MB';
  },
});
