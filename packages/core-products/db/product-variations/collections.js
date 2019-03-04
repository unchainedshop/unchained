import { Mongo } from "meteor/mongo";

export const ProductVariations = new Mongo.Collection("product_variations");
export const ProductVariationTexts = new Mongo.Collection(
  "product_variation_texts"
);
