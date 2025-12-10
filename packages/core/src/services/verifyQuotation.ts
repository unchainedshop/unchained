import { type Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { processQuotationService } from './processQuotation.ts';
import type { Modules } from '../modules.ts';

export async function verifyQuotationService(
  this: Modules,
  quotation: Quotation,
  { quotationContext }: { quotationContext?: any },
) {
  if (quotation.status !== QuotationStatus.REQUESTED) return quotation;

  const updatedQuotation = (await this.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.PROCESSING,
    info: 'verified elligibility manually',
  })) as Quotation;

  return await processQuotationService.bind(this)(updatedQuotation, { quotationContext });
}
