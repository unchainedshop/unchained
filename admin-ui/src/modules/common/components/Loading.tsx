import { useIntl } from 'react-intl';

const Loading = () => {
  const { formatMessage } = useIntl();
  return (
    <div className="my-5 flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-950 py-5">
      <div className="flex items-center justify-center space-x-1 text-sm text-slate-700 dark:text-slate-200">
        <svg
          fill="none"
          className="h-6 w-6 animate-spin"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M15.165 8.53a.5.5 0 01-.404.58A7 7 0 1023 16a.5.5 0 011 0 8 8 0 11-9.416-7.874.5.5 0 01.58.404z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </svg>

        <div>
          {formatMessage({ id: 'loading', defaultMessage: 'Loading ...' })}
        </div>
      </div>
    </div>
  );
};

export default Loading;
