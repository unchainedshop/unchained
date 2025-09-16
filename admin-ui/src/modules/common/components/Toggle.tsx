import classNames from 'classnames';
import { useRouter } from 'next/router';
import { normalizeQuery } from '../utils/utils';

const Toggle = ({
  toggleText = '',
  toggleKey = null,
  onToggle = null,
  active = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const router = useRouter();

  const toggleState = router?.query?.[toggleKey] === 'true' || active;

  const toggle = () => {
    const { skip, ...rest } = router.query;
    router.push({
      query: normalizeQuery(rest, !toggleState, toggleKey),
    });
  };

  return (
    <div className={classNames('', className)}>
      <button
        id={toggleKey}
        disabled={disabled}
        type="button"
        className={classNames(
          'relative inline-flex h-3.5 w-9 shrink-0 cursor-pointer rounded-full border-1 border-transparent transition-all duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
          {
            'bg-slate-200 dark:bg-slate-700': !toggleState,
            'bg-emerald-500 dark:bg-emerald-600 shadow-sm': toggleState,
          },
        )}
        role="switch"
        onClick={onToggle || toggle}
        aria-checked={toggleState ? 'true' : 'false'}
        {...props}
      >
        <span className="sr-only">{toggleText}</span>

        <span
          className={classNames(
            'ml-0.5 pointer-events-none relative inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition-all duration-200 ease-in-out',
            {
              'translate-x-5 shadow-md': toggleState,
              'translate-x-0': !toggleState,
            },
          )}
        >
          <span
            className={classNames(
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
              {
                'opacity-0 duration-100 ease-out': toggleState,
                'opacity-100 duration-200 ease-in': !toggleState,
              },
            )}
            aria-hidden="true"
          >
            <svg
              className="h-3 w-3 text-slate-400"
              fill="none"
              viewBox="0 0 12 12"
            >
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span
            className={classNames(
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
              {
                'opacity-100 duration-200 ease-in': toggleState,
                'opacity-0 duration-100 ease-out': !toggleState,
              },
            )}
            aria-hidden="true"
          >
            <svg
              className="h-3 w-3 text-emerald-500"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </button>
      <span className="ml-3" id="annual-billing-label">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
          {toggleText}
        </span>
      </span>
    </div>
  );
};

export default Toggle;
