import { useContext } from 'react';
import AppContext from '../components/AppContext';

const useApp = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error('useLocale must be used within a LocaleProvider');
  return context;
};

export default useApp;
