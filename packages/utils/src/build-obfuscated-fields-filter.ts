const defaultObfuscatedFields = [
  'password',
  'newPassword',
  'oldPassword',
  'authorization',
  'secret',
  'accesskey',
  'accesstoken',
  'token',
];

const buildObfuscatedFieldsFilter = (blacklistedVariables?: string[]) => {
  const sensitiveFields = blacklistedVariables ?? defaultObfuscatedFields;

  const obfuscateSensitiveFields = (data) => {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => obfuscateSensitiveFields(item));
    }

    if (typeof data === 'object') {
      if (data instanceof Date) return data;

      // A copy, not the caller's object: the work queue masks the very document it
      // then hands to the worker, so mutating in place would send ****** downstream.
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          sensitiveFields.includes(key) ? '******' : obfuscateSensitiveFields(value),
        ]),
      );
    }

    return data;
  };

  return obfuscateSensitiveFields;
};

export default buildObfuscatedFieldsFilter;
