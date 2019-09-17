import { Mongo } from 'meteor/mongo';

export const Bookmarks = new Mongo.Collection('bookmarks');

export default Bookmarks;
