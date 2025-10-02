import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { processQuotationService } from './processQuotation.js';

export async function rejectQuotationService(
  this: Modules,
  quotation: Quotation,
  { quotationContext }: { quotationContext?: any },
) {
  if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

  const updatedQuotation = (await this.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.REJECTED,
    info: 'rejected manually',
  })) as Quotation;

  return processQuotationService.bind(this)(updatedQuotation, { quotationContext });
}
