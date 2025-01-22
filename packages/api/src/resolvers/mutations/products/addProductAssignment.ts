import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';

import { Context } from '../../../context.js';
import { ProductConfiguration } from '@unchainedshop/core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
  ConfigurationVectorInvalid,
} from '../../../errors.js';
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
      Object.keys(variation).length === Object.keys(combination).length && // Ensure both have the same number of keys
      Object.entries(combination).every(([key, value]) => variation[key] === value)
    );
  });
};

export default async function addProductAssignment(
  root: never,
  params: {
    proxyId: string;
    productId: string;
    vectors: ProductConfiguration[];
  },
  { modules, userId }: Context,
) {
  const { proxyId, productId, vectors } = params;

  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });
  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const proxyProduct = await modules.products.findProduct({
    productId: proxyId,
  });
  if (!proxyProduct) throw new ProductNotFoundError({ proxyId });

  if (proxyProduct.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      proxyId,
      received: proxyProduct.type,
      required: ProductTypes.ConfigurableProduct,
    });
  const variations = await modules.products.variations.findProductVariations({
    productId: proxyId,
  });
  const variationMatrix = extractVariationMatrix(variations);
  const normalizedVectors = vectors?.reduce((prev, { key, value }) => {
    return {
      ...prev,
      [key]: value,
    };
  }, {});
  if (!combinationExists(variationMatrix, normalizedVectors))
    throw new ConfigurationVectorInvalid({ proxyId, vectors });

  await modules.products.assignments.addProxyAssignment(productId, {
    proxyId,
    vectors,
  });

  return modules.products.findProduct({ productId: proxyId });
}
