import {
  AssortmentListItemCompact,
  AssortmentResultsSummary,
  CopilotAssortmentList,
} from '../assortment';
import CopilotMediaList from '../product/CopilotMediaList';
import { renderTexts } from './textRenderers';
import { ProductList } from '../product';
import CopilotFilterList from '../product/CopilotFilterList';
import CopilotProductList from '../product/CopilotProductList';
import {
  createRenderer,
  createActionMappings,
  mergeMappings,
} from './shared/createRenderer';
import copilotCount from '../copilotCount';
import OperationStatusIndicator from '../OperationStatusIndicator';

const renderMultipleAssortments = (data: any) =>
  data?.assortments ? (
    <div className="mb-6">
      <AssortmentResultsSummary
        assortments={data.assortments}
        requestedFilters={data.filters}
      />
      <CopilotAssortmentList {...data} />
    </div>
  ) : null;

const AssortmentProducts = ({ assortment, products }) => {
  return (
    <AssortmentListItemCompact assortment={assortment}>
      <CopilotProductList products={products} />
    </AssortmentListItemCompact>
  );
};

const AssortmentLinks = ({ assortment, links }) => {
  return (
    <AssortmentListItemCompact assortment={assortment}>
      <CopilotAssortmentList assortments={links} />
    </AssortmentListItemCompact>
  );
};

const AssortmentChildren = ({ assortment, children }) => {
  return (
    <AssortmentListItemCompact assortment={assortment}>
      <CopilotAssortmentList assortments={children} />
    </AssortmentListItemCompact>
  );
};

const AssortmentFilters = ({ assortment, filters }) => {
  return (
    <AssortmentListItemCompact assortment={assortment}>
      <CopilotFilterList filters={filters} />
    </AssortmentListItemCompact>
  );
};

const ASSORTMENT_ITEM_ACTIONS = [
  'GET',
  'CREATE',
  'UPDATE',
  'SET_BASE',
  'UPDATE_STATUS',
  'ADD_LINK',
  'ADD_MEDIA',
  'ADD_PRODUCT',
  'ADD_FILTER',
];
const MEDIA_ACTIONS = ['GET_MEDIA', 'REORDER_MEDIA'];
const TEXT_ACTIONS = ['GET_TEXTS', 'GET_MEDIA_TEXTS', 'UPDATE_MEDIA_TEXTS'];

const toolsMap = mergeMappings(
  {
    LIST: renderMultipleAssortments,
    GET_CHILDREN: AssortmentChildren,
    GET_LINKS: AssortmentLinks,
    GET_PRODUCTS: AssortmentProducts,
    GET_FILTERS: AssortmentFilters,
    REORDER_LINKS: CopilotAssortmentList,
    REORDER_PRODUCTS: ProductList,
    REORDER_FILTERS: CopilotFilterList,
    COUNT: copilotCount('ASSORTMENT'),
  },
  createActionMappings(['REMOVE_MEDIA', 'REMOVE'], OperationStatusIndicator),
  createActionMappings(ASSORTMENT_ITEM_ACTIONS, AssortmentListItemCompact),
  createActionMappings(MEDIA_ACTIONS, CopilotMediaList),
  Object.fromEntries(
    TEXT_ACTIONS.map((action) => [action, renderTexts(action)]),
  ),
);

const AssortmentRenderers = createRenderer({
  toolsMap,
  fallbackComponent: ({ action, data }) =>
    JSON.stringify({ action, data }, null, 2),
});
export default AssortmentRenderers;
