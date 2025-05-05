export const has = (obj: Record<string, any>, key: string): boolean => {
  const keyParts = key.split('.');

  return (
    !!obj &&
    (keyParts.length > 1
      ? has(obj[key.split('.')[0]], keyParts.slice(1).join('.'))
      : obj.hasOwnProperty.call(obj, key))
  );
};
