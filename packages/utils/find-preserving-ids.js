const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

const sortByIndex = {
  index: 1,
};

export default (Collection) => async (selector, ids, options = {}) => {
  const defaultSort = AMAZON_DOCUMENTDB_COMPAT_MODE ? undefined : sortByIndex;

  const { skip, limit, sort = defaultSort } = options;
  const filteredSelector = {
    ...selector,
    _id: { $in: ids },
  };
  const filteredPipeline = [
    {
      $match: filteredSelector,
    },
    !AMAZON_DOCUMENTDB_COMPAT_MODE && {
      $addFields: {
        index: { $indexOfArray: [ids, '$_id'] },
      },
    },
    sort && { $sort: sort },
    skip && { $skip: skip },
    limit && { $limit: limit },
  ].filter(Boolean);

  const rawCollection = Collection.rawCollection();
  const aggregateCollection = Meteor.wrapAsync(
    rawCollection.aggregate,
    rawCollection
  );
  const aggregationPointer = aggregateCollection(filteredPipeline);
  const items = await aggregationPointer.toArray();
  return (items || []).map(item => new Collection._transform(item)); // eslint-disable-line
};
