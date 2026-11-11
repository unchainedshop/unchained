/**
 * Keys obfuscated when no list of blacklisted variables is configured. Keys match case-insensitively.
 */
export const defaultObfuscatedFields = [
  'password',
  'newPassword',
  'oldPassword',
  'authorization',
  'secret',
  'accessKey',
  'accessToken',
  'token',
];

const OBFUSCATED_VALUE = '******';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Builds a filter that returns a copy of its input with the values of sensitive keys replaced by
 * `******`, at any depth. Without `blacklistedVariables` the `defaultObfuscatedFields` apply; a
 * list replaces them, `[]` masks nothing. Keys match case-insensitively.
 *
 * The input is never modified: arrays and plain objects are copied, other values (dates,
 * ObjectIds, buffers, class instances) are returned as they are. A sensitive key that holds a plain
 * object is filtered recursively instead of masked, so a record stored under such a name (the
 * warehousing token in the input of EXPORT_TOKEN work) stays readable.
 */
const buildObfuscatedFieldsFilter = (blacklistedVariables?: string[] | null) => {
  const sensitiveFields = new Set(
    (blacklistedVariables ?? defaultObfuscatedFields).map((field) => field.toLowerCase()),
  );

  const obfuscateSensitiveFields = (data: any): any => {
    if (Array.isArray(data)) return data.map(obfuscateSensitiveFields);
    if (!isPlainObject(data)) return data;

    // fromEntries defines own properties, so a "__proto__" key cannot replace the prototype of the copy
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        sensitiveFields.has(key.toLowerCase()) && !isPlainObject(value)
          ? OBFUSCATED_VALUE
          : obfuscateSensitiveFields(value),
      ]),
    );
  };

  return obfuscateSensitiveFields;
};

export default buildObfuscatedFieldsFilter;
