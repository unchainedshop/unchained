import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { processQuotationService } from './processQuotation.js';

export async function fullfillQuotationService(this: Modules, quotation: Quotation, info) {
  if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

  const updatedQuotation = await this.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.FULLFILLED,
    info: JSON.stringify(info),
  });

  return processQuotationService.bind(this)(updatedQuotation, {});
}
