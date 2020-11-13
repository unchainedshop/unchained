export function has(obj, key) {
  const keyParts = key.split('.');

  return (
    !!obj &&
    (keyParts.length > 1
      ? has(obj[key.split('.')[0]], keyParts.slice(1).join('.'))
      : hasOwnProperty.call(obj, key))
  );
}

export function isFunction(func) {
  if (func && typeof func === 'function') {
    return true;
  }
  return false;
}
