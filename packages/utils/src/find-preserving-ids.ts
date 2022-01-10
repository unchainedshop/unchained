import { Collection, FindOptions, Query } from '@unchainedshop/types/common';

const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

const sortByIndex = {
  index: 1,
};

const sortBySequence = {
  sequence: 1,
};

const defaultSort = AMAZON_DOCUMENTDB_COMPAT_MODE
  ? sortBySequence
  : sortByIndex;

export const findPreservingIds =
  async <T>(collection: Collection<T>) =>
  async (
    selector: Query,
    ids: Array<string>,
    options?: FindOptions
  ): Promise<Array<T>> => {
    const { skip, limit, sort = defaultSort } = options;
    const filteredSelector = {
      ...selector,
      _id: { $in: ids },
    };

    const filteredPipeline = [
      {
        $match: filteredSelector,
      },
      typeof sort === 'object' &&
        'index' in sort && {
          $addFields: {
            index: { $indexOfArray: [ids, '$_id'] },
          },
        },
      sort && { $sort: sort },
      skip && { $skip: skip },
      limit && { $limit: limit },
    ].filter(Boolean);

    const aggregationPointer = collection.aggregate(filteredPipeline);
    const items = await aggregationPointer.toArray();
    return items as Array<T>;
  };
