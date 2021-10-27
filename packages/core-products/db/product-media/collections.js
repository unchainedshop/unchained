import { Mongo } from 'meteor/mongo';

export const ProductMedia = new Mongo.Collection('product_media');
export const ProductMediaTexts = new Mongo.Collection('product_media_texts');
