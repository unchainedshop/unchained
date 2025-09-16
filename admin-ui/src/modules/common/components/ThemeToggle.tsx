import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import useTheme from '../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <div className="inline-flex items-center z-50">
      <button
        type="button"
        className="group hover:cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-md p-2"
        id="theme-toggle"
        title="Toggles light & dark"
        aria-label="auto"
        aria-live="polite"
        onClick={handleToggleTheme}
      >
        <SunIcon
          className={classNames(
            'w-6 h-6 text-slate-600 transition-all ease-out delay-1000',
            {
              hidden: theme === 'dark',
            },
          )}
        />
        <MoonIcon
          className={classNames(
            'w-6 h-6 text-yellow-200 group-hover:text-white transition-colors duration-200',
            {
              hidden: theme === 'light',
            },
          )}
        />
      </button>
    </div>
  );
};

export default ThemeToggle;
