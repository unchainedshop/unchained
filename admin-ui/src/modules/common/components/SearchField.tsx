import { useIntl } from 'react-intl';
import deBounce from '../utils/deBounce';

const SearchField = ({ inputText = null, onInputChange, defaultValue }) => {
  const { formatMessage } = useIntl();
  const deBouncedInput = deBounce(200)(onInputChange);
  return (
    <div className="w-full">
      <label htmlFor="search" className="sr-only">
        {inputText || formatMessage({ id: 'search', defaultMessage: 'Search' })}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-slate-400 dark:text-slate-200"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          onChange={(e) => deBouncedInput(e.target.value)}
          id="search"
          defaultValue={defaultValue}
          name="search"
          className="block w-full rounded-md border-1 border-slate-300 dark:border-slate-700 text-slate-900 dark:bg-slate-900 dark:text-slate-200 py-3 pl-10 px-4 shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-slate-800 focus:outline-hidden sm:text-sm"
          placeholder={formatMessage({
            id: 'search',
            defaultMessage: 'Search',
          })}
          type="search"
        />
      </div>
    </div>
  );
};

export default SearchField;
