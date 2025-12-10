import type { UnchainedCore } from '@unchainedshop/core';
import type { Quotation } from '@unchainedshop/core-quotations';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ quotationId: string }, Quotation | null>(async (queries) => {
    const quotationIds = [...new Set(queries.map((q) => q.quotationId).filter(Boolean))];

    const quotations = await unchainedAPI.modules.quotations.findQuotations({
      _id: { $in: quotationIds },
    });

    const quotationMap: Record<string, Quotation> = {};
    for (const quotation of quotations) {
      quotationMap[quotation._id] = quotation;
    }

    return queries.map((q) => quotationMap[q.quotationId] || null);
  });
