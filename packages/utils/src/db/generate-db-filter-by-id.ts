import { Filter, Query, _ID } from '@unchainedshop/types/common';
import { ObjectId } from 'bson';

export const generateDbFilterById = (
  id: unknown,
  query: Query = {},
): Filter<{ _id?: _ID; [x: string]: any }> => {
  const _id = id || null; // never undefined, else it will get the first one
  return { _id, ...query };
};
