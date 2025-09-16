import { FormikValues } from 'formik';
import { isObject } from '../../common/utils/normalizeFilterKeys';

const sanitize = (value) => {
  if (value === '' || (typeof value === 'string' && value?.trim() === ''))
    return null;
  if (typeof value === 'string' && value.length) return value.trim();
  if (Array.isArray(value) && value?.length && typeof value[0] === 'string')
    return value.map((v) => sanitize(v));
  if (Array.isArray(value) && value?.length && isObject(value[0]))
    return value.map((v) =>
      Object.fromEntries(
        Object.entries(v).map(([name, val]) => [name, sanitize(val)]),
      ),
    );

  return value;
};

const clean = (values: FormikValues): FormikValues =>
  Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, sanitize(value)]),
  );

export default clean;
