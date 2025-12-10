import { type Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import type { Modules } from '../modules.ts';
import { processQuotationService } from './processQuotation.ts';

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
