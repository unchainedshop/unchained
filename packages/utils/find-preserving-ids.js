export default Collection => async (selector, ids, options = {}) => {
  const { skip, limit } = options;
  const filteredSelector = {
    ...selector,
    _id: { $in: ids }
  };

  const filteredPipeline = [
    {
      $match: filteredSelector
    },
    {
      $addFields: {
        index: { $indexOfArray: [ids, '$_id'] }
      }
    },
    {
      $sort: {
        index: 1
      }
    },
    skip && { $skip: skip },
    limit && { $limit: limit }
  ].filter(Boolean);

  const rawCollection = Collection.rawCollection();
  const aggregateCollection = Meteor.wrapAsync(
    rawCollection.aggregate,
    rawCollection
  );
  const aggregationPointer = aggregateCollection(filteredPipeline);
  const items = await aggregationPointer.toArray();
  return (items || []).map(item => new Collection._transform(item)); // eslint-disable-line
};
