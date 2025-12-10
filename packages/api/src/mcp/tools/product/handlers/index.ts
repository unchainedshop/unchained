import createProduct from './createProduct.ts';
import updateProduct from './updateProduct.ts';
import removeProduct from './removeProduct.ts';
import getProduct from './getProduct.ts';
import listProducts from './listProducts.ts';
import countProducts from './countProducts.ts';
import updateProductStatus from './updateProductStatus.ts';
import addProductMedia from './addProductMedia.ts';
import removeProductMedia from './removeProductMedia.ts';
import reorderProductMedia from './reorderProductMedia.ts';
import getProductMedia from './getProductMedia.ts';
import updateProductMediaTexts from './updateProductMediaTexts.ts';
import createProductVariation from './createProductVariation.ts';
import removeProductVariation from './removeProductVariation.ts';
import addProductVariationOption from './addProductVariationOption.ts';
import removeProductVariationOption from './removeProductVariationOption.ts';
import updateProductVariationTexts from './updateProductVariationTexts.ts';
import getVariationProducts from './getVariationProducts.ts';
import getProductAssignments from './getProductAssignments.ts';
import addProductAssignment from './addProductAssignment.ts';
import removeProductAssignment from './removeProductAssignment.ts';
import addBundleItem from './addBundleItem.ts';
import removeBundleItem from './removeBundleItem.ts';
import getBundleItems from './getBundleItems.ts';
import getCatalogPrice from './getCatalogPrice.ts';
import simulatePrice from './simulatePrice.ts';
import simulatePriceRange from './simulatePriceRange.ts';
import getProductTexts from './getProductTexts.ts';
import getVariationTexts from './getVariationTexts.ts';
import getMediaTexts from './getMediaTexts.ts';
import getReviews from './getReviews.ts';
import countReviews from './countReviews.ts';
import getSiblings from './getSiblings.ts';
import updateProductTexts from './updateProductTexts.ts';

export const actionHandlers = {
  CREATE: createProduct,
  UPDATE: updateProduct,
  REMOVE: removeProduct,
  GET: getProduct,
  LIST: listProducts,
  COUNT: countProducts,
  UPDATE_STATUS: updateProductStatus,
  ADD_MEDIA: addProductMedia,
  REMOVE_MEDIA: removeProductMedia,
  REORDER_MEDIA: reorderProductMedia,
  GET_MEDIA: getProductMedia,
  UPDATE_MEDIA_TEXTS: updateProductMediaTexts,
  CREATE_VARIATION: createProductVariation,
  REMOVE_VARIATION: removeProductVariation,
  ADD_VARIATION_OPTION: addProductVariationOption,
  REMOVE_VARIATION_OPTION: removeProductVariationOption,
  UPDATE_VARIATION_TEXTS: updateProductVariationTexts,
  GET_VARIATION_PRODUCTS: getVariationProducts,
  GET_ASSIGNMENTS: getProductAssignments,
  ADD_ASSIGNMENT: addProductAssignment,
  REMOVE_ASSIGNMENT: removeProductAssignment,
  ADD_BUNDLE_ITEM: addBundleItem,
  REMOVE_BUNDLE_ITEM: removeBundleItem,
  GET_BUNDLE_ITEMS: getBundleItems,
  GET_CATALOG_PRICE: getCatalogPrice,
  SIMULATE_PRICE: simulatePrice,
  SIMULATE_PRICE_RANGE: simulatePriceRange,
  GET_PRODUCT_TEXTS: getProductTexts,
  GET_VARIATION_TEXTS: getVariationTexts,
  GET_MEDIA_TEXTS: getMediaTexts,
  GET_REVIEWS: getReviews,
  COUNT_REVIEWS: countReviews,
  GET_SIBLINGS: getSiblings,
  UPDATE_PRODUCT_TEXTS: updateProductTexts,
};
