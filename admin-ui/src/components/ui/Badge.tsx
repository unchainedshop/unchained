import clsx from 'clsx';
import {
  bgColor,
  textColor,
  borderColor,
  badgeButtonColors,
} from '../../modules/common/data/miscellaneous';

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
      className={clsx(
        isRainbow
          ? 'inline-flex items-center text-sm font-bold text-text-primary shadow-lg relative p-[2px] bg-gradient-to-r from-rose-500 via-emerald-500 to-sky-500'
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
          className={clsx(
            'inline-flex items-center bg-surface-raised px-2.5 py-0.5',
            {
              'rounded-full': !square,
              'rounded-md': square,
            },
          )}
        >
          {dotted && (
            <svg
              className="text-text-primary -ml-1 mr-1.5 h-2 w-2"
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
              className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-text-primary hover:bg-surface-raised focus:outline-hidden focus:bg-surface-raised"
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
              )} ${badgeButtonColors(normalizedColor)} focus:outline-hidden focus:text-white`}
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
