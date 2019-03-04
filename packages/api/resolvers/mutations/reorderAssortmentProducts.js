import { log } from "meteor/unchained:core-logger";
import { AssortmentProducts } from "meteor/unchained:core-assortments";

export default function(root, { sortKeys = [] }, { userId }) {
  log("mutation reorderAssortmentProducts", { userId });
  return AssortmentProducts.updateManualOrder({ sortKeys });
}
