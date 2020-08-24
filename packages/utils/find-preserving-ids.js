const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

const sortByIndex = {
  index: 1,
};

const sortBySequence = {
  sequence: 1,
};

export default (Collection) => async (selector, ids, options = {}) => {
  const defaultSort = AMAZON_DOCUMENTDB_COMPAT_MODE
    ? sortBySequence
    : sortByIndex;

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
    rawCollection,
  );
  console.log("filteredPipeline: ", filteredPipeline[0].$match._id)
  const aggregationPointer = aggregateCollection(filteredPipeline);
  const items = await aggregationPointer.toArray();
  console.log("ITEMSLLL", items)
  return (items || []).map((item) => new Collection._transform(item)); // eslint-disable-line
};
