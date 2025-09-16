import { useContext } from 'react';
import { Theme, ThemeContext } from '../components/ThemeWrapper';

const useTheme = (): { theme: Theme; setTheme: (theme: Theme) => void } => {
  const context = useContext<any>(ThemeContext);

  if (context === undefined) {
    throw new Error('Theme Context was used outside of its Provider');
  }
  const [theme, setTheme] = context;
  return { theme, setTheme };
};

export default useTheme;
