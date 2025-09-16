import classnames from 'classnames';
import { bgColor, textColor, borderColor } from '../data/miscellaneous';

const Badge = ({
  text,
  className: classes = '',
  dotted = null,
  color = 'green',
  square = null,
  onClick = null,
}) => {
  const normalizedColor = color?.trim();
  const isRainbow = normalizedColor === 'rainbow';

  return (
    <span
      id="badge"
      className={classnames(
        isRainbow
          ? 'inline-flex items-center text-sm font-bold text-slate-900 dark:text-white shadow-lg relative p-[2px] bg-gradient-to-r from-rose-500 via-emerald-500 to-sky-500'
          : `inline-flex items-center border ${borderColor(
              normalizedColor,
              400,
            )} px-2.5 py-0.5 text-sm font-medium ${bgColor(
              normalizedColor,
              100,
            )} ${textColor(normalizedColor, 800)}`,
        classes,
        {
          'rounded-full': !square,
          'rounded-md': square,
        },
      )}
    >
      {isRainbow ? (
        <span
          className={classnames(
            'inline-flex items-center bg-white dark:bg-slate-700 px-2.5 py-0.5',
            {
              'rounded-full': !square,
              'rounded-md': square,
            },
          )}
        >
          {dotted && (
            <svg
              className="text-slate-900 dark:text-white -ml-1 mr-1.5 h-2 w-2"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
          )}
          {text}
          {onClick && (
            <button
              id="badge-x-button"
              type="button"
              onClick={onClick}
              className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-slate-900 hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-20 focus:outline-hidden focus:bg-slate-900 focus:bg-opacity-20 dark:focus:bg-white dark:focus:bg-opacity-30"
            >
              <svg
                className="h-2 w-2"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 8 8"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  d="M1 1l6 6m0-6L1 7"
                />
              </svg>
            </button>
          )}
        </span>
      ) : (
        <>
          {dotted && (
            <svg
              className={`-ml-1 mr-1.5 h-2 w-2 ${textColor(normalizedColor, 400)}`}
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
          )}
          {text}
          {onClick && (
            <button
              id="badge-x-button"
              type="button"
              onClick={onClick}
              className={`ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${textColor(
                normalizedColor,
                400,
              )} hover:${bgColor(
                normalizedColor,
                200,
              )} hover:text-${normalizedColor}-500 focus:outline-hidden focus:${bgColor(
                normalizedColor,
                500,
              )} focus:text-white`}
            >
              <svg
                className="h-2 w-2"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 8 8"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  d="M1 1l6 6m0-6L1 7"
                />
              </svg>
            </button>
          )}
        </>
      )}
    </span>
  );
};

export default Badge;
