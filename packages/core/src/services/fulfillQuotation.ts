import { type Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import type { Modules } from '../modules.ts';
import { processQuotationService } from './processQuotation.ts';

export async function fulfillQuotationService(this: Modules, quotation: Quotation, info) {
  if (quotation.status === QuotationStatus.FULFILLED) return quotation;

  const updatedQuotation = await this.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.FULFILLED,
    info: JSON.stringify(info),
  });

  return processQuotationService.bind(this)(updatedQuotation!, {});
}
