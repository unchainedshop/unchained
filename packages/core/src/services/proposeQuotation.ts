import { type Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import type { Modules } from '../modules.ts';
import { processQuotationService } from './processQuotation.ts';

export async function proposeQuotationService(
  this: Modules,
  quotation: Quotation,
  { quotationContext }: { quotationContext?: any },
) {
  if (quotation.status !== QuotationStatus.PROCESSING) return quotation;

  // persist the proposal context on the quotation so adapters can derive the
  // proposal from persisted state in quote() (quotation.context)
  if (quotationContext) {
    await this.quotations.updateContext(quotation._id, { context: quotationContext });
  }

  const updatedQuotation = (await this.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.PROPOSED,
    info: 'proposed manually',
  })) as Quotation;

  return processQuotationService.bind(this)(updatedQuotation, { quotationContext });
}
