import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { processQuotationService } from './processQuotation.js';

export const fullfillQuotationService = async (
  quotation: Quotation,
  info,
  unchainedAPI: { modules: Modules },
) => {
  if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

  const updatedQuotation = await unchainedAPI.modules.quotations.updateStatus(quotation._id, {
    status: QuotationStatus.FULLFILLED,
    info: JSON.stringify(info),
  });

  return processQuotationService(updatedQuotation, {}, unchainedAPI);
};
