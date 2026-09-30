import React, { createContext } from 'react';
import sharedContext from '../utils/sharedContext';
import clsx from 'clsx';

export const FormWrapperContext = sharedContext('FormWrapperContext', createContext(false));

const FormWrapper = ({ children, className = '' }) => {
  return (
    <FormWrapperContext.Provider value={true}>
      <div className="sm:max-w-full">
        <div className={clsx('bg-surface rounded-md shadow-sm overflow-hidden', className)}>
          {children}
        </div>
      </div>
    </FormWrapperContext.Provider>
  );
};

export default FormWrapper;
