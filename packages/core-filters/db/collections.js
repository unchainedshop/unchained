import { Mongo } from 'meteor/mongo';

export const Filters = new Mongo.Collection('filters');
export const FilterTexts = new Mongo.Collection('filter_texts');

export default Filters;
