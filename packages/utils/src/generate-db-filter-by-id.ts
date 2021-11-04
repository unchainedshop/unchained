import type { Filter, _ID } from 'unchained-core-types';
import { ObjectId } from 'bson';

export const generateDbFilterById = (id: any): Filter<{ _id?: _ID }> => {
  const _id =
    (typeof id === 'string' && id.length === 12) || id.length === 24
      ? new ObjectId(id)
      : id;
  return { _id };
};
