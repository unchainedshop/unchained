import CopilotQuotationListItemCompact from '../quotation/CopilotQuotationListItemCompact';
import CopilotQuotationList from '../quotation/CopilotQuotationList';
import {
  createActionMappings,
  createRenderer,
  mergeMappings,
} from './shared/createRenderer';
import copilotCount from '../copilotCount';

const renderMultipleQuotations = (data: any) =>
  data?.quotations?.length ? (
    <div className="mb-6">
      <CopilotQuotationList quotations={data.quotations} />
    </div>
  ) : null;

const MULTIPLE_QUOTATIONS_ACTIONS = ['LIST'];

const QUOTATION_ITEM_ACTIONS = ['GET', 'VERIFY', 'MAKE_PROPOSAL', 'REJECT'];

const toolsMap = mergeMappings(
  {
    COUNT: copilotCount('QUOTATION'),
  },
  createActionMappings(MULTIPLE_QUOTATIONS_ACTIONS, renderMultipleQuotations),
  createActionMappings(QUOTATION_ITEM_ACTIONS, (data) => (
    <CopilotQuotationListItemCompact {...(data as any)} />
  )),
);

export const QuotationRenderers = createRenderer({
  toolsMap,
});

export default QuotationRenderers;
