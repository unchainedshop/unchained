import createAssortment from './createAssortment.js';
import updateAssortment from './updateAssortment.js';
import removeAssortment from './removeAssortment.js';
import getAssortment from './getAssortment.js';
import listAssortments from './listAssortments.js';
import countAssortments from './countAssortments.js';
import updateAssortmentStatus from './updateAssortmentStatus.js';
import addAssortmentMedia from './addAssortmentMedia.js';
import removeAssortmentMedia from './removeAssortmentMedia.js';
import reorderAssortmentMedia from './reorderAssortmentMedia.js';
import getAssortmentMedia from './getAssortmentMedia.js';
import updateAssortmentMediaTexts from './updateAssortmentMediaTexts.js';
import addAssortmentProduct from './addAssortmentProduct.js';
import removeAssortmentProduct from './removeAssortmentProduct.js';
import getAssortmentProducts from './getAssortmentProducts.js';
import reorderAssortmentProducts from './reorderAssortmentProducts.js';
import addAssortmentFilter from './addAssortmentFilter.js';
import removeAssortmentFilter from './removeAssortmentFilter.js';
import getAssortmentFilters from './getAssortmentFilters.js';
import reorderAssortmentFilters from './reorderAssortmentFilters.js';
import addAssortmentLink from './addAssortmentLink.js';
import removeAssortmentLink from './removeAssortmentLink.js';
import getAssortmentLinks from './getAssortmentLinks.js';
import reorderAssortmentLinks from './reorderAssortmentLinks.js';
import getAssortmentChildren from './getAssortmentChildren.js';
import setAssortmentBase from './setAssortmentBase.js';
import searchAssortmentProducts from './searchAssortmentProducts.js';
import getAssortmentTexts from './getAssortmentTexts.js';
import getAssortmentMediaTexts from './getAssortmentMediaTexts.js';

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
  SET_BASE: setAssortmentBase,
  SEARCH_PRODUCTS: searchAssortmentProducts,
  GET_TEXTS: getAssortmentTexts,
  GET_MEDIA_TEXTS: getAssortmentMediaTexts,
};
