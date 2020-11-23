export const has = (obj, key) => {
  const keyParts = key.split('.');

  return (
    !!obj &&
    (keyParts.length > 1
      ? has(obj[key.split('.')[0]], keyParts.slice(1).join('.'))
      : hasOwnProperty.call(obj, key))
  );
};

export const isFunction = (func) => {
  return func && typeof func === 'function';
};
