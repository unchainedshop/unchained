import React from 'react';
import useFormContext from '../hooks/useFormContext';

const createHandler = (name) => () => {
  const element = document.getElementById(name);
  if (!element) return;
  element.focus();
};

const flatten = (obj, path = '') => {
  // eslint-disable-next-line
  const entries = Object.entries(obj).reduce((carry = [], [key, value]: any) => {
      // Do no walk react elements
      if (typeof value === 'string' || React.isValidElement(value)) {
        return [...carry, [`${path}${key}`, value]];
      }

      const subentries = Object.entries(
        flatten(Object.assign({}, ...value), `${path}${key}.`),
      );
      return [...subentries, ...carry];
    },
    [],
  );

  return Object.fromEntries(entries);
};

const FormErrorsPure = ({ submitError = '', fieldErrors = [] }) => {
  return (
    <div className="my-2 mb-5 text-rose-700">
      <ul className="space-y-1">
        {submitError && (
          <li key="submitError" className="disabled">
            <span dangerouslySetInnerHTML={{ __html: submitError }} />
          </li>
        )}
        {Object.entries(flatten(fieldErrors)).map(([name, message]) => (
          <li key={name} className="disabled">
            <button
              type="button"
              className="no-button text-rose-600 dark:text-rose-400"
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
  const { submitError, formik } = useFormContext();

  const fieldErrors = formik?.errors;

  const show = submitError || displayFieldErrors;

  return (
    show && (
      <FormErrorsPure
        submitError={submitError}
        fieldErrors={displayFieldErrors && fieldErrors}
      />
    )
  );
};

export default FormErrors;
