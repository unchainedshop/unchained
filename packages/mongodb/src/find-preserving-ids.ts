import type { Collection, FindOptions, Filter, Document } from 'mongodb';

const sortByIndex = {
  index: 1,
};

const defaultSort = sortByIndex;

export const findPreservingIds =
  <T extends Document>(
    collection: Collection<T>,
  ): ((selector: Filter<T>, ids: string[], options?: FindOptions) => Promise<T[]>) =>
  async (selector: Filter<T>, ids: string[], options?: FindOptions): Promise<T[]> => {
    const { skip, limit, sort = defaultSort } = options || {};
    const filteredSelector = {
      ...selector,
      _id: { $in: ids },
    };

    const filteredPipeline: any = [
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
    return items as T[];
  };
