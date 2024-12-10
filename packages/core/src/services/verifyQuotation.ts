import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { processQuotationService } from './processQuotation.js';
import { Modules } from '../modules.js';

export const verifyQuotationService = async (
  quotation: Quotation,
  { quotationContext }: { quotationContext?: any },
  unchainedAPI: { modules: Modules },
) => {
  if (quotation.status !== QuotationStatus.REQUESTED) return quotation;

  const updatedQuotation = await unchainedAPI.modules.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.PROCESSING,
    info: 'verified elligibility manually',
  });

  return await processQuotationService(updatedQuotation, { quotationContext }, unchainedAPI);
};
