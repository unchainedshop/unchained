import type { Filter } from 'mongodb';

export const generateDbFilterById = <T extends { _id?: string }>(
  id: unknown,
  query: Filter<T> = {},
): Filter<T> => {
  const _id = id || null; // never undefined, else it will get the first one
  return { _id, ...query };
};
