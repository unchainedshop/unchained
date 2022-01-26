export const isFunction = (func: () => any): boolean => {
  return func && typeof func === 'function';
};
