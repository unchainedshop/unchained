import { logs } from "./helpers/logs";

export const transformQuotation = (modules) => (quotation) => ({
  ...quotation,
  // Helpers (DEPRECATED)
  country: quotation.country,
  currency: quotation.currency,
  documents: quotation.documents,
  isExpired: quotation.isExpired,
  normalizedStatus: quotation.normalizedStatus,
  product: quotation.product,
  user: quotation.user,
  // Transform with modules 
  logs: logs(modules, 'quotationId', quotation),
});
