import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { processQuotationService } from './processQuotation.js';

export const proposeQuotationService = async (
  quotation: Quotation,
  { quotationContext }: { quotationContext?: any },
  unchainedAPI: { modules: Modules },
) => {
  if (quotation.status !== QuotationStatus.PROCESSING) return quotation;

  const updatedQuotation = await unchainedAPI.modules.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.PROPOSED,
    info: 'proposed manually',
  });

  return processQuotationService(updatedQuotation, { quotationContext }, unchainedAPI);
};
