import { log } from "meteor/unchained:core-logger";
import { Products } from "meteor/unchained:core-products";
import { ProductNotFoundError } from "../../errors";

export default function(root, { warehousing, productId }, { userId }) {
  log(`mutation updateProductWarehousing ${productId}`, { userId });
  const productObject = Products.updateProduct({ productId, warehousing });
  if (!productObject) throw new ProductNotFoundError({ data: { productId } });
  return productObject;
}
