import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function addProductAssignment(context: Context, params: Params<'ADD_ASSIGNMENT'>) {
  const { modules } = context;
  const { proxyId, assignProductId, vectors } = params;

  const proxyProduct = await modules.products.findProduct({ productId: proxyId });
  if (!proxyProduct) throw new ProductNotFoundError({ productId: proxyId });

  if (proxyProduct.type !== ProductTypes.ConfigurableProduct) {
    throw new ProductWrongTypeError({
      productId: proxyId,
      received: proxyProduct.type,
      required: ProductTypes.ConfigurableProduct,
    });
  }

  // Extract variation matrix and validate vectors
  const variations = await modules.products.variations.findProductVariations({ productId: proxyId });
  const extractVariationMatrix = (variations = []) => {
    const cartesianProduct = (arrays) => {
      return arrays.reduce(
        (acc, array) => acc.flatMap((item) => array.map((value) => [...item, value])),
        [[]],
      );
    };
    const keys = variations.map((item) => item.key);
    const options = variations.map((item) => item.options);
    const combinations = cartesianProduct(options);
    return combinations.map((combination) =>
      combination.reduce((acc, value, index) => {
        acc[keys[index]] = value;
        return acc;
      }, {}),
    );
  };

  const combinationExists = (matrix, combination) => {
    return matrix.some((variation) => {
      return (
        Object.keys(variation).length === Object.keys(combination).length &&
        Object.entries(combination).every(([key, value]) => variation[key] === value)
      );
    });
  };

  const variationMatrix = extractVariationMatrix(variations);
  const normalizedVectors = vectors?.reduce((prev, { key, value }) => {
    return { ...prev, [key]: value };
  }, {});

  if (!combinationExists(variationMatrix, normalizedVectors)) {
    throw new Error('Invalid variation vector combination');
  }

  const added = await modules.products.assignments.addProxyAssignment({
    productId: assignProductId,
    proxyId,
    vectors: vectors as any,
  });

  if (!added) throw new Error('Assignment already exists');
  const product = await getNormalizedProductDetails(assignProductId, context);

  return { product, vectors };
}
