import { Filter, ObjectId, _ID } from 'unchained-core-types';

export const generateDbFilterById = (id: any): Filter<{ _id?: _ID }> => {
  const _id =
    (typeof id === 'string' && id.length === 12) || id.length === 24
      ? new ObjectId(id)
      : id;
  return { _id };
};
