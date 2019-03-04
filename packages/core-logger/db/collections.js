import { Mongo } from "meteor/mongo";

export const Logs = new Mongo.Collection("logs");

export default Logs;
