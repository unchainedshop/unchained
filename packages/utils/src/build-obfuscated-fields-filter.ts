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

const buildObfuscatedFieldsFilter = (blacklistedVariables: string[] = []) => {
  const sensitiveFields = blacklistedVariables || defaultObfuscatedFields;

  const obfuscateSensitiveFields = (data) => {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => obfuscateSensitiveFields(item));
    }

    if (typeof data === 'object') {
      const temp = data;
      Object.keys(temp).forEach((key) => {
        if (sensitiveFields.includes(key)) {
          temp[key] = '******';
        } else {
          temp[key] = obfuscateSensitiveFields(temp[key]);
        }
      });

      return temp; // Return the modified copy
    }

    return data; // Return unchanged data for non-objects
  };

  return obfuscateSensitiveFields;
};

export default buildObfuscatedFieldsFilter;
