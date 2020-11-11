import isObject from 'lodash.isobject';

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

export const willChangeWithParent = (object, key) => {
  if (!isObject(object)) {
    return false;
  }
  let willChange = false;
  Object.keys(object).forEach((modifyingKey) => {
    if (key && key.indexOf(modifyingKey) === 0) {
      willChange = true;
    }
  });

  return willChange;
};

export const objectHasKey = (object, key) => {
  const dotNotation = {};

  // eslint-disable-next-line no-unused-expressions
  (function recurse(obj, current) {
    Object.keys(obj).forEach((objKey) => {
      const value = obj[objKey];
      const newKey = current ? `${current}.${objKey}` : objKey; // joined key with dot
      if (value && typeof value === 'object') {
        recurse(value, newKey); // it's a nested object, so do it again
      } else {
        dotNotation[newKey] = value; // it's not an object, so set the property
      }
    })(object);

    const keys = Object.keys(dotNotation);
    const newKeys = [];

    keys.forEach((_key) => {
      const parts = _key.split('.');
      const added = [];
      parts.forEach((part) => {
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(part)) {
          added.push('$');
        } else {
          added.push(part);
          newKeys.push(added.join('.'));
        }
      });
    });

    return newKeys.includes(key);
  });
};
