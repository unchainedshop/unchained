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
  logs: async ({ limit, offset }) => {
    return await modules.logs.findLogs(
      { 'meta.quotation': quotation._id },
      {
        skip: offset,
        limit,
        sort: {
          created: -1,
        },
      }
    );
  },
});
