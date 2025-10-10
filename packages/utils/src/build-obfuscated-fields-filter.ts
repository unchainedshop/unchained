const defaultObfuscatedFields = [
  'password',
  'newPassword',
  'oldPassword',
  'authorization',
  'secret',
  'accessKey',
  'accessToken',
  'token',
];

// Dangerous properties that should never be modified to prevent prototype pollution
const DANGEROUS_PROPERTIES = ['__proto__', 'constructor', 'prototype'];

const buildObfuscatedFieldsFilter = (blacklistedVariables: string[] = []) => {
  const sensitiveFields = blacklistedVariables || defaultObfuscatedFields;

  const obfuscateSensitiveFields = (data) => {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => obfuscateSensitiveFields(item));
    }

    if (typeof data === 'object') {
      // Create a new object to avoid mutating the original
      const result = {};

      // Use Object.keys to only iterate over own enumerable properties
      Object.keys(data).forEach((key) => {
        // Skip dangerous properties to prevent prototype pollution
        if (DANGEROUS_PROPERTIES.includes(key)) {
          return;
        }

        // Use hasOwnProperty for additional safety
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (sensitiveFields.includes(key)) {
            result[key] = '******';
          } else {
            result[key] = obfuscateSensitiveFields(data[key]);
          }
        }
      });

      return result;
    }

    return data; // Return unchanged data for non-objects
  };

  return obfuscateSensitiveFields;
};

export default buildObfuscatedFieldsFilter;
