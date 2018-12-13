import { Mongo } from 'meteor/mongo';

export const Products = new Mongo.Collection('products');
export const ProductTexts = new Mongo.Collection('product_texts');
