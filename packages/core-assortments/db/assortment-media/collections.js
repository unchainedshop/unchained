import { Mongo } from 'meteor/mongo';
import { createFilesCollection } from 'meteor/unchained:core-files';

export const AssortmentMedia = new Mongo.Collection('assortment_media');
export const AssortmentMediaTexts = new Mongo.Collection(
  'assortment_media_texts'
);

export const AssortmentDocuments = createFilesCollection(
  'assortment_document',
  {
    maxSize: 10485760,
    extensionRegex: /png|jpg|jpeg/i,
  }
);
