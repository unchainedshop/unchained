import { Mongo } from "meteor/mongo";

export const DeliveryProviders = new Mongo.Collection("delivery-providers");

export default DeliveryProviders;
