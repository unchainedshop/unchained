import { useContext } from 'react';
import UnchainedContext from './UnchainedContext';

const useUnchainedContext = () => {
  return useContext(UnchainedContext);
};

export default useUnchainedContext;
