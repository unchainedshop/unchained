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
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem('theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed === 'dark' || parsed === 'light') return parsed;
    }
  } catch {
    const raw = window.localStorage.getItem('theme');
    if (raw === 'dark' || raw === '"dark"') return 'dark';
    if (raw === 'light' || raw === '"light"') return 'light';
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const [theme, setTheme] = useLocalStorage('theme', getInitialTheme());

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  const value = useMemo(() => [theme, setTheme] as ThemeContextType, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeWrapper;
