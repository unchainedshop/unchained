import { Mongo } from 'meteor/mongo';

export const Assortments = new Mongo.Collection('assortments');
export const AssortmentTexts = new Mongo.Collection('assortment_texts');
export const AssortmentProducts = new Mongo.Collection('assortment_products');
export const AssortmentLinks = new Mongo.Collection('assortment_links');
export const AssortmentFilters = new Mongo.Collection('assortment_filters');
