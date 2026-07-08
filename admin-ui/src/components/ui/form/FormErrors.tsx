import React from 'react';
import useFormContext from '../../../modules/forms/hooks/useFormContext';

const createHandler = (name) => () => {
  const element = document.getElementById(name);
  if (!element) return;
  element.focus();
};

// react-hook-form nests errors as { type, message, ref } objects, with arrays
// for field arrays and plain objects for grouped fields. Flatten the tree to a
// map of dot-notation field name → message, skipping DOM refs.
const flattenErrors = (errors, path = '') => {
  if (!errors || typeof errors !== 'object') return {};
  return Object.entries(errors).reduce((acc, [key, value]: any) => {
    if (!value || key === 'ref') return acc;
    const name = `${path}${key}`;
    if (typeof value === 'string' || React.isValidElement(value)) {
      acc[name] = value;
    } else if (typeof value.message === 'string' && value.message) {
      acc[name] = value.message;
    } else if (typeof value === 'object') {
      Object.assign(acc, flattenErrors(value, `${name}.`));
    }
    return acc;
  }, {});
};

const FormErrorsPure = ({ submitError = '', fieldErrors = {} }) => {
  return (
    <div className="my-2 mb-5 text-rose-700">
      <ul className="space-y-1">
        {submitError && (
          <li key="submitError" className="disabled">
            <span dangerouslySetInnerHTML={{ __html: submitError }} />
          </li>
        )}
        {Object.entries(fieldErrors).map(([name, message]: any) => (
          <li key={name} className="disabled">
            <button
              type="button"
              className="no-button text-danger"
              aria-label="Error button"
              onClick={createHandler(name)}
            >
              {React.isValidElement(message) ? (
                message
              ) : (
                <span dangerouslySetInnerHTML={{ __html: message }} />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FormErrors = ({ displayFieldErrors = false }) => {
  const { submitError, rhf } = useFormContext();

  const fieldErrors = displayFieldErrors
    ? flattenErrors(rhf?.formState?.errors)
    : {};

  const show = submitError || displayFieldErrors;

  return (
    show && (
      <FormErrorsPure submitError={submitError} fieldErrors={fieldErrors} />
    )
  );
};

export default FormErrors;
