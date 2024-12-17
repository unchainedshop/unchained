import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { processQuotationService } from './processQuotation.js';

export async function proposeQuotationService(
  this: Modules,
  quotation: Quotation,
  { quotationContext }: { quotationContext?: any },
) {
  if (quotation.status !== QuotationStatus.PROCESSING) return quotation;

  const updatedQuotation = await this.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.PROPOSED,
    info: 'proposed manually',
  });

  return processQuotationService.bind(this)(updatedQuotation, { quotationContext });
}
