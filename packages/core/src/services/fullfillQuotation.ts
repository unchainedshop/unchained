import { type Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import type { Modules } from '../modules.ts';
import { processQuotationService } from './processQuotation.ts';

export async function fullfillQuotationService(this: Modules, quotation: Quotation, info) {
  if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

  const updatedQuotation = await this.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.FULLFILLED,
    info: JSON.stringify(info),
  });

  return processQuotationService.bind(this)(updatedQuotation!, {});
}
