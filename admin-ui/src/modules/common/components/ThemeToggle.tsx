import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
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
        className="group hover:cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-focus-ring hover:bg-surface-raised transition-colors rounded-md p-2"
        id="theme-toggle"
        title="Toggles light & dark"
        aria-label="auto"
        aria-live="polite"
        onClick={handleToggleTheme}
      >
        <SunIcon
          className={clsx(
            'w-6 h-6 text-slate-600 transition-all ease-out delay-1000',
            {
              hidden: theme === 'dark',
            },
          )}
        />
        <MoonIcon
          className={clsx(
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
