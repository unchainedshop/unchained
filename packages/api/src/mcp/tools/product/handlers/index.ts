import createProduct from './createProduct.js';
import updateProduct from './updateProduct.js';
import removeProduct from './removeProduct.js';
import getProduct from './getProduct.js';
import listProducts from './listProducts.js';
import countProducts from './countProducts.js';
import updateProductStatus from './updateProductStatus.js';
import addProductMedia from './addProductMedia.js';
import removeProductMedia from './removeProductMedia.js';
import reorderProductMedia from './reorderProductMedia.js';
import getProductMedia from './getProductMedia.js';
import updateProductMediaTexts from './updateProductMediaTexts.js';
import createProductVariation from './createProductVariation.js';
import removeProductVariation from './removeProductVariation.js';
import addProductVariationOption from './addProductVariationOption.js';
import removeProductVariationOption from './removeProductVariationOption.js';
import updateProductVariationTexts from './updateProductVariationTexts.js';
import getVariationProducts from './getVariationProducts.js';
import getProductAssignments from './getProductAssignments.js';
import addProductAssignment from './addProductAssignment.js';
import removeProductAssignment from './removeProductAssignment.js';
import addBundleItem from './addBundleItem.js';
import removeBundleItem from './removeBundleItem.js';
import getBundleItems from './getBundleItems.js';
import getCatalogPrice from './getCatalogPrice.js';
import simulatePrice from './simulatePrice.js';
import simulatePriceRange from './simulatePriceRange.js';
import getProductTexts from './getProductTexts.js';
import getVariationTexts from './getVariationTexts.js';
import getMediaTexts from './getMediaTexts.js';
import getReviews from './getReviews.js';
import countReviews from './countReviews.js';
import getSiblings from './getSiblings.js';
import updateProductTexts from './updateProductTexts.js';

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
