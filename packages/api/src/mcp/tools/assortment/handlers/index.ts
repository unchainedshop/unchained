import createAssortment from './createAssortment.ts';
import updateAssortment from './updateAssortment.ts';
import removeAssortment from './removeAssortment.ts';
import getAssortment from './getAssortment.ts';
import listAssortments from './listAssortments.ts';
import countAssortments from './countAssortments.ts';
import updateAssortmentStatus from './updateAssortmentStatus.ts';
import addAssortmentMedia from './addAssortmentMedia.ts';
import removeAssortmentMedia from './removeAssortmentMedia.ts';
import reorderAssortmentMedia from './reorderAssortmentMedia.ts';
import getAssortmentMedia from './getAssortmentMedia.ts';
import updateAssortmentMediaTexts from './updateAssortmentMediaTexts.ts';
import addAssortmentProduct from './addAssortmentProduct.ts';
import removeAssortmentProduct from './removeAssortmentProduct.ts';
import getAssortmentProducts from './getAssortmentProducts.ts';
import reorderAssortmentProducts from './reorderAssortmentProducts.ts';
import addAssortmentFilter from './addAssortmentFilter.ts';
import removeAssortmentFilter from './removeAssortmentFilter.ts';
import getAssortmentFilters from './getAssortmentFilters.ts';
import reorderAssortmentFilters from './reorderAssortmentFilters.ts';
import addAssortmentLink from './addAssortmentLink.ts';
import removeAssortmentLink from './removeAssortmentLink.ts';
import getAssortmentLinks from './getAssortmentLinks.ts';
import reorderAssortmentLinks from './reorderAssortmentLinks.ts';
import getAssortmentChildren from './getAssortmentChildren.ts';
import searchAssortmentProducts from './searchAssortmentProducts.ts';
import getAssortmentTexts from './getAssortmentTexts.ts';
import getAssortmentMediaTexts from './getAssortmentMediaTexts.ts';

export default {
  CREATE: createAssortment,
  UPDATE: updateAssortment,
  REMOVE: removeAssortment,
  GET: getAssortment,
  LIST: listAssortments,
  COUNT: countAssortments,
  UPDATE_STATUS: updateAssortmentStatus,
  ADD_MEDIA: addAssortmentMedia,
  REMOVE_MEDIA: removeAssortmentMedia,
  REORDER_MEDIA: reorderAssortmentMedia,
  GET_MEDIA: getAssortmentMedia,
  UPDATE_MEDIA_TEXTS: updateAssortmentMediaTexts,
  ADD_PRODUCT: addAssortmentProduct,
  REMOVE_PRODUCT: removeAssortmentProduct,
  GET_PRODUCTS: getAssortmentProducts,
  REORDER_PRODUCTS: reorderAssortmentProducts,
  ADD_FILTER: addAssortmentFilter,
  REMOVE_FILTER: removeAssortmentFilter,
  GET_FILTERS: getAssortmentFilters,
  REORDER_FILTERS: reorderAssortmentFilters,
  ADD_LINK: addAssortmentLink,
  REMOVE_LINK: removeAssortmentLink,
  GET_LINKS: getAssortmentLinks,
  REORDER_LINKS: reorderAssortmentLinks,
  GET_CHILDREN: getAssortmentChildren,
  SEARCH_PRODUCTS: searchAssortmentProducts,
  GET_TEXTS: getAssortmentTexts,
  GET_MEDIA_TEXTS: getAssortmentMediaTexts,
};
