import { Filter, Query, _ID } from '@unchainedshop/types/common';
import { ObjectId } from 'bson';

export const generateId = (id: unknown): ObjectId =>
  typeof id === 'string' &&
  ((id.length === 12 && id.includes('-')) || id.length === 24)
    ? new ObjectId(id)
    : (id as ObjectId);

export const generateDbFilterById = (
  id: unknown,
  query: Query = {}
): Filter<{ _id?: _ID; [x: string]: any }> => {
  const _id = id;
  return { _id, ...query };
};
