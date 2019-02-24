import { Mongo } from 'meteor/mongo';
import { createFilesCollection } from 'meteor/unchained:core-files';

// import config from '/unchained-config.js';

export const ProductMedia = new Mongo.Collection('product_media');
export const ProductMediaTexts = new Mongo.Collection('product_media_texts');

export const Media = createFilesCollection('media', {
  maxSize: 10485760,
  extensionRegex: /png|jpg|jpeg/i,
});
