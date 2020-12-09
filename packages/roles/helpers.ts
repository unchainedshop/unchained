export const has = (obj: { [key: string]: any }, key: string): boolean => {
  const keyParts = key.split('.');

  return (
    !!obj &&
    (keyParts.length > 1
      ? has(obj[key.split('.')[0]], keyParts.slice(1).join('.'))
      : obj.hasOwnProperty.call(obj, key))
  );
};

export const isFunction = (func: () => any): boolean => {
  return func && typeof func === 'function';
};
