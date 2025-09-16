import React, { createContext } from 'react';
import classNames from 'classnames';

export const FormWrapperContext = createContext(false);

const FormWrapper = ({ children, className = '' }) => {
  return (
    <FormWrapperContext.Provider value={true}>
      <div className="sm:max-w-full">
        <div
          className={classNames(
            'bg-white dark:bg-slate-800 rounded-md shadow-sm overflow-hidden',
            className,
          )}
        >
          {children}
        </div>
      </div>
    </FormWrapperContext.Provider>
  );
};

export default FormWrapper;
