import { ProductListItemCompact, ProductList } from '../product';
import AssignmentListCompact from '../product/AssignmentListCompact';
import AssignmentListItemCompact from '../product/AssignmentListItemCompact';
import CopilotMediaList from '../product/CopilotMediaList';
import CopilotPriceCompact from '../product/CopilotPriceCompact';
import ProductResultsSummary from '../ProductResultsSummary';

import { renderTexts } from './textRenderers';
import OperationStatusIndicator from '../OperationStatusIndicator';
import {
  createActionMappings,
  createRenderer,
  mergeMappings,
} from './shared/createRenderer';
import copilotCount from '../copilotCount';

const renderMultipleProducts = (data: any) =>
  data?.products?.length ? (
    <div className="mb-6">
      <ProductResultsSummary
        products={data.products}
        requestedFilters={data.filters}
      />
      <ProductList products={data.products} />
    </div>
  ) : null;

const MULTIPLE_PRODUCTS_ACTIONS = [
  'LIST',
  'GET_VARIATION_PRODUCTS',
  'GET_PRODUCTS',
  'GET_SIBLINGS',
];
const PRODUCT_ITEM_ACTIONS = [
  'GET',
  'CREATE',
  'UPDATE',
  'UPDATE_STATUS',
  'CREATE_OPTION',
  'CREATE_VARIATION',
  'ADD_VARIATION_OPTION',
  'ADD_BUNDLE_ITEM',
  'GET_BUNDLE_ITEMS',
  'ADD_MEDIA',
];
const OPERATION_STATUS_ACTIONS = [
  'REMOVE',
  'REMOVE_ASSIGNMENT',
  'REMOVE_MEDIA',
  'REMOVE_BUNDLE_ITEM',
];
const MEDIA_ACTIONS = ['GET_MEDIA', 'REORDER_MEDIA'];
const TEXT_ACTIONS = [
  'GET_PRODUCT_TEXTS',
  'GET_VARIATION_TEXTS',
  'GET_MEDIA_TEXTS',
  'UPDATE_VARIATION_TEXTS',
  'UPDATE_MEDIA_TEXTS',
  'UPDATE_PRODUCT_TEXTS',
];
const PRICE_ACTIONS = [
  'SIMULATE_PRICE',
  'SIMULATE_PRICE_RANGE',
  'GET_CATALOG_PRICE',
];
const toolsMap = mergeMappings(
  {
    ADD_ASSIGNMENT: (data) => <AssignmentListItemCompact {...(data as any)} />,
    GET_ASSIGNMENTS: (data) => <AssignmentListCompact {...(data as any)} />,
    COUNT: copilotCount('PRODUCT'),
  },
  createActionMappings(MULTIPLE_PRODUCTS_ACTIONS, renderMultipleProducts),
  createActionMappings(PRODUCT_ITEM_ACTIONS, (data) => (
    <ProductListItemCompact {...(data as any)} />
  )),
  createActionMappings(OPERATION_STATUS_ACTIONS, (data) => (
    <OperationStatusIndicator {...(data as any)} />
  )),
  createActionMappings(MEDIA_ACTIONS, (data) => (
    <CopilotMediaList {...(data as any)} />
  )),
  createActionMappings(PRICE_ACTIONS, (data) => (
    <CopilotPriceCompact {...(data as any)} />
  )),
  Object.fromEntries(
    TEXT_ACTIONS.map((action) => [action, renderTexts(action)]),
  ),
);

export const ProductRenderers = createRenderer({
  toolsMap,
});

export default ProductRenderers;
