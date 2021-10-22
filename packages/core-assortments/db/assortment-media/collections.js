import { Mongo } from 'meteor/mongo';

export const AssortmentMedia = new Mongo.Collection('assortment_media');
export const AssortmentMediaTexts = new Mongo.Collection(
  'assortment_media_texts'
);
