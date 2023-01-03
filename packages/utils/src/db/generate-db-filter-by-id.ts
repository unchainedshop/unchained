import { Filter, _ID } from '@unchainedshop/types/common.js';

export const generateDbFilterById = <T extends { _id?: _ID }>(
  id: unknown,
  query: Filter<T> = {},
): Filter<T> => {
  const _id = id || null; // never undefined, else it will get the first one
  return { _id, ...query };
};
