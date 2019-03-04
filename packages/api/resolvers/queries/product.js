import { log } from "meteor/unchained:core-logger";
import { Products } from "meteor/unchained:core-products";

export default function(root, { productId, slug }, { userId }) {
  log(`query product ${productId} ${slug}`, { userId });
  if (!productId === !slug) {
    throw new Error("please choose either a productId or a slug");
  }
  if (productId) {
    return Products.findOne({ _id: productId });
  }
  return Products.findOne({ slugs: slug });
}
