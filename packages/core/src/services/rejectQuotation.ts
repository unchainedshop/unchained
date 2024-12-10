import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { processQuotationService } from './processQuotation.js';

export const rejectQuotationService = async (
  quotation: Quotation,
  { quotationContext }: { quotationContext?: any },
  unchainedAPI: { modules: Modules },
) => {
  if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

  const updatedQuotation = await unchainedAPI.modules.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.REJECTED,
    info: 'rejected manually',
  });

  return processQuotationService(updatedQuotation, { quotationContext }, unchainedAPI);
};
