import { Assortments } from 'meteor/unchained:core-assortments';
import { findPreservingIds } from 'meteor/unchained:utils';

export default {
  totalAssortments: async ({ assortmentsSelector, totalAssortmentIds }) =>
    Assortments.find({
      ...(await assortmentsSelector),
      _id: { $in: await totalAssortmentIds },
    }).count(),
  assortments: async (
    { assortmentsSelector, totalAssortmentIds, sortStage },
    { offset, limit }
  ) =>
    findPreservingIds(Assortments)(
      await assortmentsSelector,
      await totalAssortmentIds,
      {
        skip: offset,
        limit,
        sort: await sortStage,
      }
    ),
};
