import { Assortments } from 'meteor/unchained:core-assortments';
import { findPreservingIds } from 'meteor/unchained:utils';

export default {
  assortments: async (
    { assortmentsSelector, totalAssortmentIds, sortStage },
    { offset, limit },
  ) =>
    findPreservingIds(Assortments)(
      await assortmentsSelector,
      await totalAssortmentIds,
      {
        skip: offset,
        limit,
        sort: await sortStage,
      },
    ),
};
