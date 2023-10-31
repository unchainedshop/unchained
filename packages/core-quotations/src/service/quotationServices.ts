import { QuotationServices } from '@unchainedshop/types/quotations.js';
import { removeUserQuotationService } from './removeUserQuotationService.js';

export const quotationServices: QuotationServices = {
  removeUserQuotations: removeUserQuotationService,
};
