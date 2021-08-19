import { Mongo } from 'meteor/mongo';

export const ObjectsCollection = new Mongo.Collection('files');

export default ObjectsCollection;
