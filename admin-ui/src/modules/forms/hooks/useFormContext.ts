import { useContext } from 'react';

import FormContext from '../lib/FormContext';

const useFormContext = () => useContext(FormContext);

export default useFormContext;
