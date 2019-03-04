import { log } from "meteor/unchained:core-logger";
import { Products } from "meteor/unchained:core-products";
import { ProductNotFoundError, ProductWrongStatusError } from "../../errors";

export default function(root, { productId }, { userId }) {
  log(`mutation unpublishProduct ${productId}`, { userId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ data: { productId } });
  if (!product.unpublish()) {
    throw new ProductWrongStatusError({ data: { status: product.status } });
  }

  return Products.findOne({ _id: productId });
}
