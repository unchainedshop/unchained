import { Mongo } from 'meteor/mongo';

export const WorkQueue = new Mongo.Collection('work_queue');

export default WorkQueue;
