import { Mongo } from "meteor/mongo";

export const OrderPositions = new Mongo.Collection("order_positions");

export default OrderPositions;
