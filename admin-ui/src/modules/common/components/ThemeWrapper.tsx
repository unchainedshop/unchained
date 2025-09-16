import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
} from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
export type Theme = 'light' | 'dark';

type ThemeContextType = [Theme, Dispatch<SetStateAction<Theme>>];

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

interface ThemeWrapperProps {
  children: ReactNode;
}
const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  useEffect(() => {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.getElementsByTagName('html')[0].classList.add('dark');
    } else {
      document.getElementsByTagName('html')[0].classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.getElementsByTagName('html')[0].classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.getElementsByTagName('html')[0].classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [theme]);

  const value = useMemo(() => [theme, setTheme] as ThemeContextType, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeWrapper;
